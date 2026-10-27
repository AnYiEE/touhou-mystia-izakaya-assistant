import { type NextRequest } from 'next/server';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { ACCOUNT_SYNC_API_RESPONSE_CODE_MAP } from '@/features/account/sync/apiResponseCodes';
import { parseClientSyncGeneration } from '@/features/account/sync/protocol';
import {
	createFeatureAccessGuardErrorResponse,
	requireFeatureAccess,
} from '@/features/featureAccess/server/requireFeatureAccess';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IDeleteAccountDataBody {
	state_epoch: number;
	sync_generation: number;
}

function parseDeleteAccountDataBody(
	value: unknown
): IDeleteAccountDataBody | null {
	if (!checkIsRecord(value)) {
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

	const [csrfModule, featureAccess] = await Promise.all([
		import('@/features/account/server/auth/accountCsrf'),
		requireFeatureAccess(request, 'account.sync'),
	]);
	if (featureAccess.status === 'error') {
		return createFeatureAccessGuardErrorResponse(featureAccess);
	}
	const { account } = featureAccess;
	if (account === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-delete-data'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!csrfModule.verifyAccountCsrf(request, account.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const bodyResult =
		await readJsonBodyResult<IDeleteAccountDataBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = parseDeleteAccountDataBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	const expectedStateEpoch = body.state_epoch;
	const expectedSyncGeneration = body.sync_generation;
	if (expectedSyncGeneration !== account.user.sync_generation) {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.generationMismatch,
			409,
			{
				state_epoch: account.user.state_epoch,
				sync_generation: account.user.sync_generation,
				sync_status: account.user.sync_status,
			}
		);
	}
	if (expectedStateEpoch !== account.user.state_epoch) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.stateEpochMismatch,
			409,
			{
				state_epoch: account.user.state_epoch,
				sync_generation: account.user.sync_generation,
				sync_status: account.user.sync_status,
			}
		);
	}

	const [userStateModule, accountAuditModule] = await Promise.all([
		import('@/features/account/sync/server'),
		import('@/features/account/server/audit/service'),
	]);
	const clearResult =
		await userStateModule.clearUserStateIfStateEpochWithAudit(
			account.user.id,
			expectedStateEpoch,
			expectedSyncGeneration,
			{ id: account.session.id, token_hash: account.session.token_hash },
			(trx, auditNow, nextStateEpoch, nextSyncGeneration) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.accountDataCleared,
						metadata: {
							nickname: account.user.nickname,
							state_epoch: nextStateEpoch,
							sync_generation: nextSyncGeneration,
							sync_status: ACCOUNT_SYNC_STATUS_MAP.pausedEmpty,
							username: account.user.username,
						},
						request,
						userId: account.user.id,
					}),
					auditNow
				)
		);
	if (clearResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.stateEpochMismatch,
			409,
			{
				state_epoch: clearResult.state_epoch,
				sync_generation: clearResult.sync_generation,
				sync_status: clearResult.sync_status,
			}
		);
	}
	if (clearResult.status === 'sync-generation-mismatch') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.generationMismatch,
			409,
			{
				state_epoch: clearResult.state_epoch,
				sync_generation: clearResult.sync_generation,
				sync_status: clearResult.sync_status,
			}
		);
	}
	if (clearResult.status === 'sync-paused') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.paused,
			409,
			{
				state_epoch: clearResult.state_epoch,
				sync_generation: clearResult.sync_generation,
				sync_status: clearResult.sync_status,
			}
		);
	}
	if (clearResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}
	return createNoStoreJsonResponse({
		state_epoch: clearResult.state_epoch,
		sync_generation: clearResult.sync_generation,
		sync_status: clearResult.sync_status,
	});
}
