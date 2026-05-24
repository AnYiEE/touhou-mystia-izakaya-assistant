import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { clearAdminSessionCookie } from '@/lib/account/server/admin';
import { authenticateAdminRequest, checkAdminFeatureResponse } from '../utils';

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

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		clearAdminSessionCookie(response, request);
		return response;
	}

	const adminModule = await import('@/lib/account/server/admin');

	return createNoStoreJsonResponse({
		csrf_token: adminModule.createAdminCsrfToken(auth.token),
		username: auth.payload.username,
	});
}
