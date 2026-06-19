import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { createNoStoreJsonResponse } from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
		'account-list-sso-grants'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-list-sso-grants'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const { listSsoUserClientGrantsForUser } =
		await import('@/lib/account/server/sso');
	const grants = await listSsoUserClientGrantsForUser(auth.data.user.id);

	return createNoStoreJsonResponse({ grants });
}
