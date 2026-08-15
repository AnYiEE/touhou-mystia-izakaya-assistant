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
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { ACCOUNT_SYNC_API_RESPONSE_CODE_MAP } from '@/features/account/sync/apiResponseCodes';
import { checkSyncProtocolRequestBody } from '@/features/account/sync/protocol';
import { getAccountSyncCapacityConfiguration } from '@/features/account/sync/server/capacity';
import { createSyncClientUpdateRequiredResponse } from '@/features/account/sync/server/protocolResponse';
import { putSyncStateChanges } from '@/features/account/sync/server/state';
import type {
	ISyncProtocolRequest,
	ISyncStatePingBody,
} from '@/features/account/sync/types';
import { parseSyncStatePutBody } from '@/features/account/sync/validation';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
		'sync-ping'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'sync-ping'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const capacityConfiguration = getAccountSyncCapacityConfiguration();
	const bodyResult = await readJsonBodyResult<
		ISyncProtocolRequest & ISyncStatePingBody
	>(request, capacityConfiguration.requestMaxBytes);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.requestTooLarge,
			413,
			{ limit_bytes: capacityConfiguration.requestMaxBytes }
		);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (typeof body?.csrf_token !== 'string') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	if (
		!csrfModule.verifyAccountCsrfToken(
			body.csrf_token,
			auth.data.sessionTokenHash
		)
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}
	if (!checkSyncProtocolRequestBody(body)) {
		return createSyncClientUpdateRequiredResponse();
	}

	const parsedBody = parseSyncStatePutBody(body, [
		'csrf_token',
		'protocol_version',
	]);
	if (parsedBody === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	if (auth.data.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.paused,
			409,
			{
				state_epoch: auth.data.user.state_epoch,
				sync_generation: auth.data.user.sync_generation,
				sync_status: auth.data.user.sync_status,
			}
		);
	}
	if (parsedBody.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.stateEpochMismatch,
			409,
			{
				state_epoch: auth.data.user.state_epoch,
				sync_generation: auth.data.user.sync_generation,
				sync_status: auth.data.user.sync_status,
			}
		);
	}
	if (parsedBody.sync_generation !== auth.data.user.sync_generation) {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.generationMismatch,
			409,
			{
				state_epoch: auth.data.user.state_epoch,
				sync_generation: auth.data.user.sync_generation,
				sync_status: auth.data.user.sync_status,
			}
		);
	}

	const writeResult = await putSyncStateChanges({
		body: parsedBody,
		conflictParseMode: 'item-error',
		session: auth.data.session,
		userId: auth.data.user.id,
	});
	if (writeResult.status === 'corrupt-user-state') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.corruptUserState,
			500
		);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.stateEpochMismatch,
			409,
			{
				state_epoch: writeResult.state_epoch,
				sync_generation: writeResult.sync_generation,
				sync_status: writeResult.sync_status,
			}
		);
	}
	if (writeResult.status === 'sync-generation-mismatch') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.generationMismatch,
			409,
			{
				state_epoch: writeResult.state_epoch,
				sync_generation: writeResult.sync_generation,
				sync_status: writeResult.sync_status,
			}
		);
	}
	if (writeResult.status === 'sync-paused') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.paused,
			409,
			{
				state_epoch: writeResult.state_epoch,
				sync_generation: writeResult.sync_generation,
				sync_status: writeResult.sync_status,
			}
		);
	}
	if (writeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}

	return createNoStoreJsonResponse({
		results: writeResult.results,
		state_epoch: auth.data.user.state_epoch,
		sync_generation: auth.data.user.sync_generation,
		sync_status: auth.data.user.sync_status,
	});
}
