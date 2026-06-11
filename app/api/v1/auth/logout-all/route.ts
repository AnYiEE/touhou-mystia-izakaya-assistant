import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const requestStartedAt = Date.now();

	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'auth-logout-all'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const sessionsModule = await import('@/actions/account/sessions');
	await sessionsModule.deleteSessionsByUserId(auth.data.user.id, {
		createdBefore: requestStartedAt,
	});

	const response = createNoStoreJsonResponse({ message: 'logged-out-all' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
