import { type NextRequest } from 'next/server';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import { checkAccountRateLimitGuard } from '@/features/account/server/http/guards';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { getAccountSyncCapacityConfiguration } from '@/features/account/sync/server/capacity';
import {
	parseUserStateRecord,
	putSyncStateChanges,
} from '@/features/account/sync/server/state';
import type { ISyncStatePutBody } from '@/features/account/sync/types';
import {
	checkSyncNamespace,
	parseSyncStatePutBody,
} from '@/features/account/sync/validation';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createCorruptUserStateResponse() {
	return createNoStoreErrorResponse('corrupt-user-state', 500);
}

export async function GET(request: NextRequest) {
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
		'sync-state-get'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/sync/server/repository'),
	]);
	const auth = await authModule.authenticateAccountFromRequestWithTransaction(
		request,
		async (trx, account) => {
			const rateLimitResult = checkAccountRateLimitGuard(
				request,
				'sync-state-get'
			);
			if (rateLimitResult.status === 'error') {
				return {
					error: rateLimitResult,
					status: 'rate-limit-error' as const,
				};
			}

			const namespaceParams =
				request.nextUrl.searchParams.getAll('namespace');
			const namespaces = namespaceParams.filter(checkSyncNamespace);
			if (namespaces.length !== namespaceParams.length) {
				return { status: 'unknown-namespace' as const };
			}

			return {
				snapshot:
					await userStateModule.getUserStateSnapshotInTransaction(
						trx,
						{
							credential: account.credential,
							namespaces:
								namespaces.length === 0 ? null : namespaces,
							user: account.user,
						}
					),
				status: 'ok' as const,
			};
		}
	);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}
	if (auth.result.status === 'rate-limit-error') {
		const { data, headers, httpStatus, message } = auth.result.error;
		return createNoStoreErrorResponse(
			message,
			httpStatus,
			data,
			headers === undefined ? undefined : { headers }
		);
	}
	if (auth.result.status === 'unknown-namespace') {
		return createNoStoreErrorResponse('unknown-namespace', 400);
	}

	const { snapshot } = auth.result;

	try {
		return createNoStoreJsonResponse({
			records: snapshot.records.map(parseUserStateRecord),
			state_epoch: snapshot.state_epoch,
			sync_generation: snapshot.user.sync_generation,
			sync_status: snapshot.user.sync_status,
		});
	} catch (error) {
		console.warn('Failed to parse stored sync state.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return createCorruptUserStateResponse();
	}
}

export async function PUT(request: NextRequest) {
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
		'sync-state-put'
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
		'sync-state-put'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const capacityConfiguration = getAccountSyncCapacityConfiguration();
	const bodyResult = await readJsonBodyResult<ISyncStatePutBody>(
		request,
		capacityConfiguration.requestMaxBytes
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('sync-request-too-large', 413, {
			limit_bytes: capacityConfiguration.requestMaxBytes,
		});
	}

	const body = parseSyncStatePutBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (auth.data.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return createNoStoreErrorResponse('sync-paused', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}
	if (body.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}
	if (body.sync_generation !== auth.data.user.sync_generation) {
		return createNoStoreErrorResponse('sync-generation-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}

	const writeResult = await putSyncStateChanges({
		body,
		conflictParseMode: 'fail',
		session: auth.data.session,
		userId: auth.data.user.id,
	});
	if (writeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
			sync_generation: writeResult.sync_generation,
			sync_status: writeResult.sync_status,
		});
	}
	if (writeResult.status === 'sync-paused') {
		return createNoStoreErrorResponse('sync-paused', 409, {
			state_epoch: writeResult.state_epoch,
			sync_generation: writeResult.sync_generation,
			sync_status: writeResult.sync_status,
		});
	}
	if (writeResult.status === 'sync-generation-mismatch') {
		return createNoStoreErrorResponse('sync-generation-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
			sync_generation: writeResult.sync_generation,
			sync_status: writeResult.sync_status,
		});
	}
	if (writeResult.status === 'corrupt-user-state') {
		return createCorruptUserStateResponse();
	}

	return createNoStoreJsonResponse({
		results: writeResult.results,
		state_epoch: auth.data.user.state_epoch,
		sync_generation: auth.data.user.sync_generation,
		sync_status: auth.data.user.sync_status,
	});
}
