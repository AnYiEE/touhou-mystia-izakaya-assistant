import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import {
	MAX_SYNC_JSON_BODY_BYTES,
	checkSyncNamespace,
	createUserStateRecord,
	parseSyncStatePutBody,
	parseUserStateRecord,
} from '@/api/v1/sync/utils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	type ISyncStateItemConflict,
	type ISyncStatePutBody,
	type TSyncStatePutResult,
} from '@/lib/account/sync';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createConflictResult(
	namespace: ISyncStateItemConflict['namespace'],
	current: Awaited<
		ReturnType<typeof import('@/actions/account/userState').getUserState>
	>
): ISyncStateItemConflict {
	const record = current === null ? null : parseUserStateRecord(current);

	return {
		data: record?.data ?? null,
		namespace,
		revision: record?.revision ?? 0,
		schema_version: record?.schema_version ?? 0,
		status: 'conflict',
		updated_at: record?.updated_at ?? 0,
	};
}

function createCorruptUserStateResponse() {
	return createNoStoreErrorResponse('corrupt-user-state', 500);
}

export async function GET(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const namespaceParams = request.nextUrl.searchParams.getAll('namespace');
	const namespaces = namespaceParams.filter(checkSyncNamespace);
	if (namespaces.length !== namespaceParams.length) {
		return createNoStoreErrorResponse('unknown-namespace', 400);
	}

	const records =
		namespaces.length === 0
			? await userStateModule.listUserState(auth.data.user.id)
			: await userStateModule.listUserStateByNamespaces(
					auth.data.user.id,
					namespaces
				);

	try {
		return createNoStoreJsonResponse({
			records: records.map(parseUserStateRecord),
			state_epoch: auth.data.user.state_epoch,
		});
	} catch (error) {
		console.warn('Failed to parse stored sync state.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return createCorruptUserStateResponse();
	}
}

export async function PUT(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'sync-state-put'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const bodyResult = await readJsonBodyResult<ISyncStatePutBody>(
		request,
		MAX_SYNC_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = parseSyncStatePutBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (body.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
		});
	}

	const userStateModule = await import('@/actions/account/userState');

	const results: TSyncStatePutResult[] = [];
	const batchUpdatedAt = Date.now();
	const preparedChanges = body.changes.map((change) => {
		const updatedAt = batchUpdatedAt;
		const nextRevision = change.revision + 1;
		const record = createUserStateRecord(
			auth.data.user.id,
			change,
			nextRevision,
			updatedAt
		);
		if (record === null) {
			return {
				result: {
					message: 'internal-write-error',
					namespace: change.namespace,
					status: 'error',
				} satisfies TSyncStatePutResult,
				status: 'error' as const,
			};
		}

		return {
			change,
			nextRevision,
			record,
			status: 'ready' as const,
			updatedAt,
		};
	});
	const readyChanges = preparedChanges.filter(
		(
			change
		): change is Extract<
			(typeof preparedChanges)[number],
			{ status: 'ready' }
		> => change.status === 'ready'
	);
	const writeResult = await userStateModule.putUserStateEntriesIfRevision(
		readyChanges.map((change) => ({
			entry: change.record,
			expectedRevision: change.change.revision,
		})),
		body.state_epoch,
		auth.data.session,
		auth.data.user.id
	);
	if (writeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
		});
	}
	if (writeResult.status === 'corrupt-user-state') {
		return createCorruptUserStateResponse();
	}

	let writeResultIndex = 0;
	for (const preparedChange of preparedChanges) {
		if (preparedChange.status === 'error') {
			results.push(preparedChange.result);
			continue;
		}

		const result = writeResult.results[writeResultIndex++];
		if (result === undefined) {
			results.push({
				message: 'internal-write-error',
				namespace: preparedChange.change.namespace,
				status: 'error',
			});
			continue;
		}
		if (result.status === 'conflict') {
			try {
				results.push(
					createConflictResult(
						preparedChange.change.namespace,
						result.current
					)
				);
			} catch (error) {
				console.warn('Failed to parse conflicting sync state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				return createCorruptUserStateResponse();
			}
			continue;
		}

		results.push({
			namespace: preparedChange.change.namespace,
			revision: result.entry.revision,
			status: 'ok',
			updated_at: result.entry.updated_at,
		});
	}

	return createNoStoreJsonResponse({
		results,
		state_epoch: auth.data.user.state_epoch,
	});
}
