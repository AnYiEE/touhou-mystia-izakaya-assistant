import { type NextRequest } from 'next/server';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

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
		'admin-logout'
	);
	if (rateLimitResponse !== null) {
		console.warn('Admin logout rate limit exceeded; continuing logout.');
	}

	const adminModule = await import('@/features/account/admin/server/auth');
	const auth = await authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const csrfResponse = checkAdminCsrfRouteResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const response = createNoStoreJsonResponse({ message: 'admin-logged-out' });
	adminModule.clearAdminSessionCookie(response, request);

	return response;
}
