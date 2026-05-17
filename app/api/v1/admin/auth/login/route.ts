import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { type IAdminLoginBody } from '@/lib/account/shared/types';
import { checkAdminFeatureResponse } from '../../utils';

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

	const body = await readJsonBody<IAdminLoginBody>(request);
	if (
		typeof body?.username !== 'string' ||
		typeof body.password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-login',
		body.username
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const adminModule = await import('@/lib/account/server/admin');
	if (!adminModule.checkAdminCredentials(body.username, body.password)) {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	const token = adminModule.createAdminSessionToken(body.username);
	const response = createNoStoreJsonResponse({
		csrf_token: adminModule.createAdminCsrfToken(token),
		username: body.username,
	});
	adminModule.setAdminSessionCookie(response, token, request);

	return response;
}
