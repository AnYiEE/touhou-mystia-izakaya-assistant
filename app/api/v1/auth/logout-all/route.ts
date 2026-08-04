import { type NextRequest } from 'next/server';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
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

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const [sessionsModule, accountAuditModule] = await Promise.all([
		import('@/features/account/server/persistence/repositories/sessions'),
		import('@/features/account/server/audit/service'),
	]);
	const deleteResult = await sessionsModule.deleteSessionsByUserIdWithAudit(
		auth.data.user.id,
		{
			createdBefore: requestStartedAt,
			initiatingSession: {
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
		},
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
						nickname: auth.data.user.nickname,
						username: auth.data.user.username,
					},
					request,
					userId: auth.data.user.id,
				}),
				auditNow
			)
	);
	if (deleteResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}

	return createNoStoreJsonResponse({
		deleted_current_session: deleteResult.deletedSessionCount > 0,
		message: ACCOUNT_API_RESPONSE_CODE_MAP.loggedOutAll,
	});
}
