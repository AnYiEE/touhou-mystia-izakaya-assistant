import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import { ACCOUNT_SYNC_STATUS_MAP } from '@/lib/account/shared/constants';
import { parseClientSyncGeneration } from '@/lib/account/sync/protocol';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IDeleteAccountDataBody {
	state_epoch: number;
	sync_generation: number;
}

function parseDeleteAccountDataBody(
	value: unknown
): IDeleteAccountDataBody | null {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}
	const parsedGeneration = parseClientSyncGeneration(value);
	if (parsedGeneration === null) {
		return null;
	}
	const stateEpoch = Object.getOwnPropertyDescriptor(value, 'state_epoch')
		?.value as unknown;
	return typeof stateEpoch === 'number' &&
		Number.isSafeInteger(stateEpoch) &&
		stateEpoch >= 0 &&
		stateEpoch < Number.MAX_SAFE_INTEGER
		? { state_epoch: stateEpoch, sync_generation: parsedGeneration }
		: null;
}

export async function DELETE(request: NextRequest) {
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
		'account-delete-data'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-delete-data'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const bodyResult =
		await readJsonBodyResult<IDeleteAccountDataBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseDeleteAccountDataBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	const expectedStateEpoch = body.state_epoch;
	const expectedSyncGeneration = body.sync_generation;
	if (expectedSyncGeneration !== auth.data.user.sync_generation) {
		return createNoStoreErrorResponse('sync-generation-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}
	if (expectedStateEpoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}

	const [userStateModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/userState'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const clearResult =
		await userStateModule.clearUserStateIfStateEpochWithAudit(
			auth.data.user.id,
			expectedStateEpoch,
			expectedSyncGeneration,
			{
				id: auth.data.session.id,
				token_hash: auth.data.session.token_hash,
			},
			(trx, auditNow, nextStateEpoch, nextSyncGeneration) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.accountDataCleared,
						metadata: {
							nickname: auth.data.user.nickname,
							state_epoch: nextStateEpoch,
							sync_generation: nextSyncGeneration,
							sync_status: ACCOUNT_SYNC_STATUS_MAP.pausedEmpty,
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				)
		);
	if (clearResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (clearResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: clearResult.state_epoch,
			sync_generation: clearResult.sync_generation,
			sync_status: clearResult.sync_status,
		});
	}
	if (clearResult.status === 'sync-paused') {
		return createNoStoreErrorResponse('sync-paused', 409, {
			state_epoch: clearResult.state_epoch,
			sync_generation: clearResult.sync_generation,
			sync_status: clearResult.sync_status,
		});
	}
	if (clearResult.status === 'sync-generation-mismatch') {
		return createNoStoreErrorResponse('sync-generation-mismatch', 409, {
			state_epoch: clearResult.state_epoch,
			sync_generation: clearResult.sync_generation,
			sync_status: clearResult.sync_status,
		});
	}
	return createNoStoreJsonResponse({
		state_epoch: clearResult.state_epoch,
		sync_generation: clearResult.sync_generation,
		sync_status: clearResult.sync_status,
	});
}
