import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import { type TAccountMeResponse } from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-me',
		'',
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, userModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/repositories/userState'),
	]);
	const auth = await authModule.authenticateAccountFromRequestWithTransaction(
		request,
		(trx, account) =>
			userStateModule.getUserStateSnapshotInTransaction(trx, {
				credential: account.credential,
				namespaces: null,
				user: account.user,
			}),
		true
	);
	if (auth.status === 'error') {
		if (auth.message === 'unauthorized') {
			return createNoStoreJsonResponse({
				csrf_token: null,
				featureEnabled: true,
				has_password: false,
				isLoggedIn: false,
				password_must_change: false,
				state_epoch: null,
				syncMeta: null,
				user: null,
			} satisfies TAccountMeResponse);
		}

		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const stateSnapshot = auth.result;
	const revisions = stateSnapshot.records.reduce<Record<string, number>>(
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
		has_password: stateSnapshot.credential.password_set === 1,
		isLoggedIn: true,
		password_must_change:
			stateSnapshot.credential.password_must_change === 1,
		state_epoch: stateSnapshot.user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: stateSnapshot.user.state_epoch,
		},
		user: userModule.createAccountUserProfile(stateSnapshot.user),
	} satisfies TAccountMeResponse);
}
