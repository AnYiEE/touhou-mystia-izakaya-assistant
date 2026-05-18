import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
} from '../../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-logout'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const adminModule = await import('@/lib/account/server/admin');
	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		adminModule.clearAdminSessionCookie(response, request);
		return response;
	}

	const csrfResponse = checkAdminCsrfResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const response = createNoStoreJsonResponse({ message: 'admin-logged-out' });
	adminModule.clearAdminSessionCookie(response, request);

	return response;
}
