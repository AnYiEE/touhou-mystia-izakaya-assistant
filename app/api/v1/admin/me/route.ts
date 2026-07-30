import { type NextRequest } from 'next/server';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { createNoStoreJsonResponse } from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

	const auth = await authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'admin-me'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const adminModule = await import('@/features/account/admin/server/auth');

	return createNoStoreJsonResponse({
		auth_source: auth.source,
		csrf_token: adminModule.createAdminCsrfToken(auth.token),
		username: auth.payload.username,
	});
}
