import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
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
		'account-delete'
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
		'account-delete'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [usersModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/accountAuditService'),
	]);
	await usersModule.setUserStatusAndDeleteSessionsWithAudit(
		auth.data.user.id,
		USER_STATUS_MAP.deleted,
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.accountDeleted,
					metadata: {
						auth_record_digest:
							accountAuditModule.createAccountAuditValueDigest(
								auth.data.session.id
							),
					},
					request,
					userId: auth.data.user.id,
				}),
				auditNow
			)
	);

	const response = createNoStoreJsonResponse({ message: 'user-deleted' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
