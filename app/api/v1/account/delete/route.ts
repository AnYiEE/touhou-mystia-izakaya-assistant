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

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'account-delete'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, usersModule, sessionsModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/users'),
		import('@/actions/account/sessions'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	await usersModule.setUserStatus(auth.data.user.id, USER_STATUS_MAP.deleted);
	await sessionsModule.deleteSessionsByUserId(auth.data.user.id);
	const response = createNoStoreJsonResponse({ message: 'account-deleted' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
