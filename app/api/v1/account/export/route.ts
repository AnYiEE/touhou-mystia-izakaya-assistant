import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
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

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'account-export'
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
		'account-export'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [userStateModule, userModule, accountAuditModule] = await Promise.all(
		[
			import('@/lib/account/server/repositories/userState'),
			import('@/lib/account/server/user'),
			import('@/lib/account/server/accountAuditService'),
		]
	);
	const snapshot = await userStateModule.getActiveUserStateSnapshotForSession(
		{
			namespaces: null,
			session: {
				id: auth.data.session.id,
				token_hash: auth.data.session.token_hash,
			},
			userId: auth.data.user.id,
		}
	);
	if (snapshot.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	await accountAuditModule.writeAccountAuditLogBestEffort(
		accountAuditModule.createAccountUserAuditLogInput({
			action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
				.accountDataExported,
			metadata: {
				namespace_count: snapshot.records.length,
				nickname: snapshot.user.nickname,
				state_epoch: snapshot.user.state_epoch,
				username: snapshot.user.username,
			},
			request,
			userId: auth.data.user.id,
		})
	);

	return createNoStoreJsonResponse({
		state: snapshot.records,
		state_epoch: snapshot.user.state_epoch,
		user: userModule.createAccountUserProfile(snapshot.user),
	});
}
