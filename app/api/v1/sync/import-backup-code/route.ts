import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import { AccountSyncCapacityExceededError } from '@/lib/account/server/syncCapacity';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody {
	code: string;
}

function createImportBackupErrorResponse(error: unknown) {
	if (error instanceof AccountSyncCapacityExceededError) {
		return createNoStoreErrorResponse(
			'sync-account-capacity-exceeded',
			409,
			{
				candidate_bytes: error.details.candidateBytes,
				current_bytes: error.details.currentBytes,
				limit_bytes: error.details.limitBytes,
				namespaces: error.details.namespaces,
			}
		);
	}
	if (!(error instanceof Error)) {
		return null;
	}

	if (error.message === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (error.message === 'backup-code-not-found') {
		return createNoStoreErrorResponse('backup-code-not-found', 404);
	}
	if (error.message === 'invalid-backup-file') {
		return createNoStoreErrorResponse('invalid-backup-file', 400);
	}
	if (error.message === 'server-misconfigured') {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	if (error.message === 'sync-conflict') {
		return createNoStoreErrorResponse('sync-conflict', 409);
	}
	if (error.message === 'backup-code-lock-lost') {
		return createNoStoreErrorResponse('backup-code-lock-lost', 409);
	}

	return null;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'import-backup-code'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const bodyResult = await readJsonBodyResult<IImportBackupCodeBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const rawCode = typeof body?.code === 'string' ? body.code.trim() : '';
	if (rawCode === '' || !validate(rawCode)) {
		return createNoStoreErrorResponse('invalid-backup-code', 400);
	}
	const code = rawCode.toLowerCase();

	const [authModule, lockModule, backupImportModule, accountAuditModule] =
		await Promise.all([
			import('@/lib/account/server/auth'),
			import('@/actions/backup/lock'),
			import('@/lib/account/server/backupImport'),
			import('@/lib/account/server/accountAuditService'),
		]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'import-backup-code',
		'',
		{ parts: [{ name: 'backup-code', value: code }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const codeDigest = accountAuditModule.createAccountAuditValueDigest(code);
	const createAuditInput = (
		result: 'already-imported' | 'imported',
		namespaceCount: number,
		stateEpoch: number
	) =>
		accountAuditModule.createAccountUserAuditLogInput({
			action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
				.accountDataImported,
			metadata: {
				backup_code_digest: codeDigest,
				namespace_count: namespaceCount,
				result,
				state_epoch: stateEpoch,
			},
			request,
			userId: auth.data.user.id,
		});

	try {
		let importedBackupFileName: string | null | undefined;
		const response = await lockModule.withBackupCodeLock(
			code,
			async (signal) => {
				let importResult;
				try {
					importResult = await backupImportModule.importBackupData({
						code,
						expectedStateEpoch: auth.data.user.state_epoch,
						lockModule,
						session: auth.data.session,
						signal,
						userId: auth.data.user.id,
						writeAuditLog: (trx, now, result) =>
							accountAuditModule.writeAccountAuditLogInTransaction(
								trx,
								createAuditInput(
									'imported',
									result.namespaceCount,
									result.stateEpoch
								),
								now
							),
					});
				} catch (error) {
					const errorResponse =
						createImportBackupErrorResponse(error);
					if (errorResponse !== null) {
						return errorResponse;
					}
					throw error;
				}
				if (importResult.status === 'not-found') {
					return createNoStoreErrorResponse(
						'backup-code-not-found',
						404
					);
				}
				if (importResult.status === 'state-epoch-mismatch') {
					return createNoStoreErrorResponse(
						'state-epoch-mismatch',
						409,
						{ state_epoch: importResult.state_epoch }
					);
				}
				if (importResult.status === 'already-imported') {
					await accountAuditModule.writeAccountAuditLog(
						createAuditInput(
							'already-imported',
							importResult.results.length,
							auth.data.user.state_epoch
						)
					);
					return createNoStoreJsonResponse({
						results: importResult.results,
					});
				}

				lockModule.markBackupCodeLockCommitted(signal);
				importedBackupFileName = importResult.fileName;

				return createNoStoreJsonResponse({
					results: importResult.results,
				});
			}
		);
		if (importedBackupFileName !== undefined) {
			void backupImportModule.cleanupImportedBackupFile(
				code,
				importedBackupFileName
			);
		}

		return response;
	} catch (error) {
		if (lockModule.checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		}
		if (lockModule.checkBackupCodeLockTimeoutError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-timeout', 409);
		}

		throw error;
	}
}
