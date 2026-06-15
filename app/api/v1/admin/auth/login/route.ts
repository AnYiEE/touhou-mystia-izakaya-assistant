import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import { checkAdminFeatureRouteResponse } from '@/lib/account/server/adminRouteResponses';
import { type IAdminLoginBody } from '@/lib/account/shared/types';
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

	const bodyResult = await readJsonBodyResult<IAdminLoginBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.username !== 'string' ||
		typeof body.password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const username = body.username.trim();
	if (username === '' || username.length > 128 || body.password === '') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const usernameRateLimitKey = username.toLowerCase();
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'admin-login',
		usernameRateLimitKey,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const adminModule = await import('@/lib/account/server/admin');
	if (!adminModule.checkAdminCredentials(username, body.password)) {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	const token = adminModule.createAdminSessionToken(username);
	const response = createNoStoreJsonResponse({
		csrf_token: adminModule.createAdminCsrfToken(token),
		username,
	});
	adminModule.setAdminSessionCookie(response, token, request);

	return response;
}
