import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
} from '@/lib/account/server/routeResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'account-delete-data'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const userStateModule =
		await import('@/lib/account/server/repositories/userState');
	let stateEpoch: number;
	try {
		stateEpoch = await userStateModule.clearUserStateAndIncrementStateEpoch(
			auth.data.user.id
		);
	} catch (error) {
		if (error instanceof Error && error.message === 'user-not-found') {
			return createNoStoreErrorResponse('unauthorized', 401);
		}

		throw error;
	}

	return createNoStoreJsonResponse({ state_epoch: stateEpoch });
}
