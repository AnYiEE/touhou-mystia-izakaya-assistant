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
import { parseSyncStatePutBody } from '@/lib/account/sync/validation';
import { getAccountSyncCapacityConfiguration } from '@/lib/account/server/syncCapacity';
import { putSyncStateChanges } from '@/lib/account/server/syncState';
import { type ISyncStatePingBody } from '@/lib/account/sync';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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

	const authModule = await import('@/lib/account/server/auth');
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
	const bodyResult = await readJsonBodyResult<ISyncStatePingBody>(
		request,
		capacityConfiguration.requestMaxBytes
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('sync-request-too-large', 413, {
			limit_bytes: capacityConfiguration.requestMaxBytes,
		});
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (typeof body?.csrf_token !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const parsedBody = parseSyncStatePutBody(body, ['csrf_token']);
	if (parsedBody === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	if (
		!authModule.verifyAccountCsrfToken(
			body.csrf_token,
			auth.data.sessionTokenHash
		)
	) {
		return createNoStoreErrorResponse('forbidden', 403);
	}
	if (parsedBody.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
		});
	}

	const writeResult = await putSyncStateChanges({
		body: parsedBody,
		conflictParseMode: 'item-error',
		session: auth.data.session,
		userId: auth.data.user.id,
	});
	if (writeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
		});
	}
	if (writeResult.status === 'corrupt-user-state') {
		return createNoStoreErrorResponse('corrupt-user-state', 500);
	}

	return createNoStoreJsonResponse({
		results: writeResult.results,
		state_epoch: auth.data.user.state_epoch,
	});
}
