import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { type TAccountMeResponse } from '@/lib/account/shared/types';

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

	const [authModule, userModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/actions/account/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		if (auth.message === 'unauthorized') {
			return createNoStoreJsonResponse({
				csrf_token: null,
				featureEnabled: true,
				isLoggedIn: false,
				password_must_change: false,
				state_epoch: null,
				syncMeta: null,
				user: null,
			} satisfies TAccountMeResponse);
		}

		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	const stateSnapshot = await userStateModule.getUserStateSnapshot(
		auth.data.user.id
	);
	if (stateSnapshot === null) {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	const revisions = stateSnapshot.state.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return createNoStoreJsonResponse({
		csrf_token: authModule.createAccountCsrfToken(
			auth.data.sessionTokenHash
		),
		featureEnabled: true,
		isLoggedIn: true,
		password_must_change: auth.data.credential.password_must_change === 1,
		state_epoch: stateSnapshot.user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: stateSnapshot.user.state_epoch,
		},
		user: userModule.createAccountUserProfile(stateSnapshot.user),
	} satisfies TAccountMeResponse);
}
