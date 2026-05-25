import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import { createNoStoreJsonResponse } from '@/api/v1/utils';
import {
	authenticateAdminRequest,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '../utils';

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

	const adminModule = await import('@/lib/account/server/admin');

	return createNoStoreJsonResponse({
		csrf_token: adminModule.createAdminCsrfToken(auth.token),
		username: auth.payload.username,
	});
}
