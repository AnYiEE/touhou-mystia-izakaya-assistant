import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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

	const [authModule, csrfModule, sessionModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
		import('@/features/account/server/auth/sessionLifecycle'),
	]);
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

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [sessionsModule, accountAuditModule] = await Promise.all([
		import('@/features/account/server/persistence/repositories/sessions'),
		import('@/features/account/server/audit/service'),
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
	sessionModule.clearAccountSessionCookie(response, request);

	return response;
}
