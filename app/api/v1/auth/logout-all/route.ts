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
	const requestStartedAt = Date.now();

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
		'auth-logout-all'
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
		'auth-logout-all'
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
	const deletedSessionCount =
		await sessionsModule.deleteSessionsByUserIdWithAudit(
			auth.data.user.id,
			{ createdBefore: requestStartedAt },
			(trx, auditNow, deletedSessionCount) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.logoutAll,
						metadata: {
							auth_record_digest:
								accountAuditModule.createAccountAuditValueDigest(
									auth.data.session.id
								),
							deleted_record_count: deletedSessionCount,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				)
		);

	return createNoStoreJsonResponse({
		deleted_current_session: deletedSessionCount > 0,
		message: 'logged-out-all',
	});
}
