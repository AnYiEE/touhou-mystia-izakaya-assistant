import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminFromRequest,
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/lib/account/server/adminRouteResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureRouteResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
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

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'admin-clear-user-data',
		'',
		{ parts: [{ name: 'target-user', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const csrfResponse = checkAdminCsrfRouteResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const userStateModule =
		await import('@/lib/account/server/repositories/userState');

	try {
		const stateEpoch =
			await userStateModule.clearUserDataAndDeleteSessionsAndIncrementStateEpoch(
				id
			);

		return createNoStoreJsonResponse({ state_epoch: stateEpoch });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return createNoStoreErrorResponse('target-user-not-found', 404);
			}
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse('invalid-user-status', 403);
			}
			if (error.message === 'update-not-applied') {
				return createNoStoreErrorResponse('update-not-applied', 409);
			}
		}

		throw error;
	}
}
