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

export async function GET(request: NextRequest) {
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
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	return createNoStoreJsonResponse({
		state: await userStateModule.listUserState(auth.data.user.id),
		state_epoch: auth.data.user.state_epoch,
		user: userModule.createAccountUserProfile(auth.data.user),
	});
}
