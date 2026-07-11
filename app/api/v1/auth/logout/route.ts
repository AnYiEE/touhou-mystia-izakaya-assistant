import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
		'auth-logout'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'auth-logout'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [sessionsModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/sessions'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const didLogout = await sessionsModule.deleteSessionByIdWithAudit(
		auth.data.user.id,
		{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash },
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.logout,
					metadata: {
						auth_record_digest:
							accountAuditModule.createAccountAuditValueDigest(
								auth.data.session.id
							),
						nickname: auth.data.user.nickname,
						username: auth.data.user.username,
					},
					request,
					userId: auth.data.user.id,
				}),
				auditNow
			)
	);
	if (!didLogout) {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	const response = createNoStoreJsonResponse({ message: 'logged-out' });
	authModule.clearAccountSessionCookie(response, request);

	return response;
}
