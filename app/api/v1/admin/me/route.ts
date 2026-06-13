import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminRequest,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/lib/account/server/adminRouteResponses';
import { createNoStoreJsonResponse } from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-me'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const adminModule = await import('@/lib/account/server/admin');

	return createNoStoreJsonResponse({
		csrf_token: adminModule.createAdminCsrfToken(auth.token),
		username: auth.payload.username,
	});
}
