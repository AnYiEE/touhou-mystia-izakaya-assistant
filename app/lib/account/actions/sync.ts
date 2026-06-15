'use server';

import { validate } from 'uuid';

import {
	type TAccountActionResult,
	createAccountActionError as createActionError,
} from '@/lib/account/actions/utils';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';
import {
	authenticateAccountFromRequest,
	verifyAccountCsrf,
} from '@/lib/account/server/auth';
import {
	parseUserStateRecord,
	putSyncStateChanges,
} from '@/lib/account/server/syncState';
import {
	checkSyncNamespace,
	parseSyncStatePutBody,
} from '@/lib/account/sync/validation';
import {
	listUserState,
	listUserStateByNamespaces,
} from '@/lib/account/server/repositories/userState';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePutBody,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';
import {
	MAX_ACCOUNT_SMALL_JSON_BODY_BYTES,
	MAX_SYNC_JSON_BODY_BYTES,
} from '@/lib/account/shared/requestLimits';
import { getLogSafeErrorCode } from '@/lib/logging';

export type TAccountSyncActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createGuardActionError(result: {
	data?: Record<string, unknown>;
	httpStatus: number;
	message: string;
	status: string;
}): Extract<TAccountSyncActionResult, { status: 'error' }> {
	return createActionError(result.message, result.httpStatus, result.data);
}

function createSyncActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAccountSyncActionResult, { status: 'error' }> {
	return createActionError(message, httpStatus, data);
}

async function checkSyncActionGuards(
	request: ReturnType<typeof createCurrentRequest> extends Promise<infer R>
		? R
		: never
) {
	const featureResult = await checkAccountFeatureGuard();
	if (featureResult.status === 'error') {
		return createGuardActionError(featureResult);
	}

	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const auth = await authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createGuardActionError(auth);
	}

	return {
		resolvedRequest: request,
		session: auth.data.session,
		sessionTokenHash: auth.data.sessionTokenHash,
		status: 'ok' as const,
		user: auth.data.user,
	};
}

function checkSyncActionRateLimit(
	request: ReturnType<typeof createCurrentRequest> extends Promise<infer R>
		? R
		: never,
	scope: string
) {
	const rateLimitResult = checkAccountRateLimitGuard(request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	return null;
}

function checkSyncActionCsrf(
	request: ReturnType<typeof createCurrentRequest> extends Promise<infer R>
		? R
		: never,
	sessionTokenHash: string
) {
	if (!verifyAccountCsrf(request, sessionTokenHash || '')) {
		return createSyncActionError('forbidden', 403);
	}

	return null;
}

function stringifyActionJsonBodySafe(body: unknown, maxBytes: number) {
	try {
		const text = JSON.stringify(body);
		if (new TextEncoder().encode(text).byteLength > maxBytes) {
			return { status: 'payload-too-large' as const };
		}
		return { status: 'ok' as const, text };
	} catch {
		return { status: 'invalid' as const };
	}
}

function mapSyncWriteResult(
	writeResult: Awaited<ReturnType<typeof putSyncStateChanges>>
) {
	if (writeResult.status === 'unauthorized') {
		return createSyncActionError('unauthorized', 401);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createSyncActionError('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
		});
	}
	if (writeResult.status === 'corrupt-user-state') {
		return createSyncActionError('corrupt-user-state', 500);
	}

	return { data: writeResult, status: 'ok' as const };
}

export async function fetchSyncStateAction(
	namespaces: unknown = []
): Promise<TAccountSyncActionResult<ISyncStateGetResponse>> {
	if (!Array.isArray(namespaces)) {
		return createSyncActionError('unknown-namespace', 400);
	}

	const searchParams = new URLSearchParams();
	for (const namespace of namespaces) {
		if (typeof namespace !== 'string') {
			return createSyncActionError('unknown-namespace', 400);
		}
		searchParams.append('namespace', namespace);
	}

	const query = searchParams.toString();
	const request = await createCurrentRequest(
		`/api/v1/sync/state${query.length > 0 ? `?${query}` : ''}`
	);
	const guardResult = await checkSyncActionGuards(request);
	if (guardResult.status === 'error') {
		return guardResult;
	}

	const namespaceParams =
		guardResult.resolvedRequest.nextUrl.searchParams.getAll('namespace');
	const resolvedNamespaces = namespaceParams.filter(checkSyncNamespace);
	if (resolvedNamespaces.length !== namespaceParams.length) {
		return createSyncActionError('unknown-namespace', 400);
	}

	const records =
		resolvedNamespaces.length === 0
			? await listUserState(guardResult.user.id)
			: await listUserStateByNamespaces(
					guardResult.user.id,
					resolvedNamespaces
				);

	try {
		return {
			data: {
				records: records.map(parseUserStateRecord),
				state_epoch: guardResult.user.state_epoch,
			} satisfies ISyncStateGetResponse,
			status: 'ok',
		};
	} catch (error) {
		console.warn('Failed to parse stored sync state.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return createSyncActionError('corrupt-user-state', 500);
	}
}

export async function putSyncStateAction(
	body: ISyncStatePutBody,
	csrfToken: unknown
): Promise<TAccountSyncActionResult<ISyncStatePutResponse>> {
	const request = await createCurrentRequest('/api/v1/sync/state', {
		headers: {
			...(typeof csrfToken === 'string'
				? { 'x-csrf-token': csrfToken }
				: {}),
		},
		method: 'PUT',
	});

	const guardResult = await checkSyncActionGuards(request);
	if (guardResult.status === 'error') {
		return guardResult;
	}

	const rlResult = checkSyncActionRateLimit(request, 'sync-state-put');
	if (rlResult !== null) {
		return rlResult;
	}

	const csrfError = checkSyncActionCsrf(
		request,
		guardResult.sessionTokenHash
	);
	if (csrfError !== null) {
		return csrfError;
	}

	const bodyResult = stringifyActionJsonBodySafe(
		body,
		MAX_SYNC_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createSyncActionError('payload-too-large', 413);
	}
	if (bodyResult.status === 'invalid') {
		return createSyncActionError('invalid-object-structure', 400);
	}

	const parsed = parseSyncStatePutBody(body);
	if (parsed === null) {
		return createSyncActionError('invalid-object-structure', 400);
	}
	if (parsed.state_epoch !== guardResult.user.state_epoch) {
		return createSyncActionError('state-epoch-mismatch', 409, {
			state_epoch: guardResult.user.state_epoch,
		});
	}

	const writeResult = await putSyncStateChanges({
		body: parsed,
		conflictParseMode: 'fail',
		session: guardResult.session,
		userId: guardResult.user.id,
	});

	const mappedResult = mapSyncWriteResult(writeResult);
	if (mappedResult.status === 'error') {
		return mappedResult;
	}
	if (writeResult.status !== 'ok') {
		return createSyncActionError('internal-write-error', 500);
	}

	return {
		data: {
			results: writeResult.results,
			state_epoch: guardResult.user.state_epoch,
		} satisfies ISyncStatePutResponse,
		status: 'ok',
	};
}

export async function importBackupCodeAction(
	code: unknown,
	csrfToken: unknown
): Promise<TAccountSyncActionResult<ISyncImportBackupCodeResponse>> {
	const bodyResult = stringifyActionJsonBodySafe(
		{ code },
		MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createSyncActionError('payload-too-large', 413);
	}
	if (bodyResult.status === 'invalid') {
		return createSyncActionError('invalid-backup-code', 400);
	}

	const rawCode = typeof code === 'string' ? code.trim() : '';
	if (rawCode === '' || !validate(rawCode)) {
		return createSyncActionError('invalid-backup-code', 400);
	}
	const normalizedCode = rawCode.toLowerCase();

	const request = await createCurrentRequest(
		'/api/v1/sync/import-backup-code',
		{
			body: bodyResult.text,
			headers: {
				'Content-Type': 'application/json',
				...(typeof csrfToken === 'string'
					? { 'x-csrf-token': csrfToken }
					: {}),
			},
			method: 'POST',
		}
	);

	const guardResult = await checkSyncActionGuards(request);
	if (guardResult.status === 'error') {
		return guardResult;
	}

	const rlResult = checkSyncActionRateLimit(request, 'import-backup-code');
	if (rlResult !== null) {
		return rlResult;
	}

	const csrfError = checkSyncActionCsrf(
		request,
		guardResult.sessionTokenHash
	);
	if (csrfError !== null) {
		return csrfError;
	}

	const [lockModule, backupImportModule] = await Promise.all([
		import('@/actions/backup/lock'),
		import('@/lib/account/server/backupImport'),
	]);

	let importedBackupFileName: string | null | undefined;
	try {
		const response = await lockModule.withBackupCodeLock(
			normalizedCode,
			async (signal: unknown) => {
				let importResult;
				try {
					importResult = await backupImportModule.importBackupData({
						code: normalizedCode,
						expectedStateEpoch: guardResult.user.state_epoch,
						lockModule,
						session: guardResult.session,
						signal: signal as Parameters<
							typeof backupImportModule.importBackupData
						>[0]['signal'],
						userId: guardResult.user.id,
					});
				} catch (error) {
					if (error instanceof Error) {
						if (error.message === 'unauthorized') {
							return createSyncActionError('unauthorized', 401);
						}
						if (error.message === 'backup-code-not-found') {
							return createSyncActionError(
								'backup-code-not-found',
								404
							);
						}
						if (error.message === 'invalid-backup-file') {
							return createSyncActionError(
								'invalid-backup-file',
								400
							);
						}
						if (error.message === 'server-misconfigured') {
							return createSyncActionError(
								'server-misconfigured',
								500
							);
						}
						if (error.message === 'sync-conflict') {
							return createSyncActionError('sync-conflict', 409);
						}
						if (error.message === 'backup-code-lock-lost') {
							return createSyncActionError(
								'backup-code-lock-lost',
								409
							);
						}
					}
					throw error;
				}

				if (importResult.status === 'not-found') {
					return createSyncActionError('backup-code-not-found', 404);
				}
				if (importResult.status === 'state-epoch-mismatch') {
					return createSyncActionError('state-epoch-mismatch', 409, {
						state_epoch: importResult.state_epoch,
					});
				}
				if (importResult.status === 'already-imported') {
					return createSyncActionError(
						'backup-code-already-imported',
						409
					);
				}

				lockModule.markBackupCodeLockCommitted(
					signal as Parameters<
						typeof lockModule.markBackupCodeLockCommitted
					>[0]
				);
				importedBackupFileName = importResult.fileName;
				return {
					data: {
						results: importResult.results,
					} satisfies ISyncImportBackupCodeResponse,
					status: 'ok' as const,
				};
			}
		);

		if (importedBackupFileName !== undefined) {
			void backupImportModule.cleanupImportedBackupFile(
				normalizedCode,
				importedBackupFileName
			);
		}

		return response;
	} catch (error) {
		if (lockModule.checkBackupCodeLockLostError(error)) {
			return createSyncActionError('backup-code-lock-lost', 409);
		}
		if (lockModule.checkBackupCodeLockTimeoutError(error)) {
			return createSyncActionError('backup-code-lock-timeout', 409);
		}

		throw error;
	}
}
