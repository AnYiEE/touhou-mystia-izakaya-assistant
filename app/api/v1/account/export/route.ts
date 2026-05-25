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

export async function GET(request: NextRequest) {
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
		'account-export'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, userStateModule, userModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/userState'),
		import('@/lib/account/server/user'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		authModule.clearAccountSessionCookie(response, request);

		return response;
	}
	const snapshot = await userStateModule.getUserStateSnapshot(
		auth.data.user.id
	);
	if (snapshot === null) {
		const response = createNoStoreErrorResponse('unauthorized', 401);
		authModule.clearAccountSessionCookie(response, request);

		return response;
	}

	return createNoStoreJsonResponse({
		state: snapshot.state,
		state_epoch: snapshot.user.state_epoch,
		user: userModule.createAccountUserProfile(snapshot.user),
	});
}
