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

export async function DELETE(request: NextRequest) {
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
		'account-delete-data'
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
		'account-delete-data'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [userStateModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/userState'),
		import('@/lib/account/server/accountAuditService'),
	]);
	let stateEpoch: number;
	try {
		stateEpoch =
			await userStateModule.clearUserStateAndIncrementStateEpochWithAudit(
				auth.data.user.id,
				(trx, auditNow, nextStateEpoch) =>
					accountAuditModule.writeAccountAuditLogInTransaction(
						trx,
						accountAuditModule.createAccountUserAuditLogInput({
							action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
								.accountDataCleared,
							metadata: { state_epoch: nextStateEpoch },
							request,
							userId: auth.data.user.id,
						}),
						auditNow
					)
			);
	} catch (error) {
		if (error instanceof Error && error.message === 'user-not-found') {
			return createNoStoreErrorResponse('unauthorized', 401);
		}

		throw error;
	}
	return createNoStoreJsonResponse({ state_epoch: stateEpoch });
}
