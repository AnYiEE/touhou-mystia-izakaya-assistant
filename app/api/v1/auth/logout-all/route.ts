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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
		'auth-logout-all'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, sessionsModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/sessions'),
	]);
	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		authModule.clearAccountSessionCookie(response, request);

		return response;
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	await sessionsModule.deleteSessionsByUserId(auth.data.user.id);
	const response = createNoStoreJsonResponse({ message: 'logged-out-all' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
