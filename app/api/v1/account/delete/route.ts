import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
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

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'account-delete'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, usersModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/users'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(authModule, auth, request);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	await usersModule.setUserStatusAndDeleteSessions(
		auth.data.user.id,
		USER_STATUS_MAP.deleted
	);
	const response = createNoStoreJsonResponse({ message: 'account-deleted' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
