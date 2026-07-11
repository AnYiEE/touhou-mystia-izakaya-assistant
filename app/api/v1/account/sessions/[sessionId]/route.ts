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

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	const { sessionId } = await params;
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
		'account-session-delete'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-session-delete',
		'',
		{ parts: [{ name: 'session', value: sessionId }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}
	if (sessionId === auth.data.session.id) {
		return createNoStoreErrorResponse('cannot-revoke-current-session', 400);
	}

	const [sessionsModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/sessions'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const didDelete = await sessionsModule.deleteOtherSessionByUserIdWithAudit(
		{
			currentSessionId: auth.data.session.id,
			currentSessionTokenHash: auth.data.sessionTokenHash,
			sessionId,
			userId: auth.data.user.id,
		},
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.sessionRevoked,
					metadata: {
						nickname: auth.data.user.nickname,
						target_record_digest:
							accountAuditModule.createAccountAuditValueDigest(
								sessionId
							),
						username: auth.data.user.username,
					},
					request,
					userId: auth.data.user.id,
				}),
				auditNow
			)
	);
	if (didDelete.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (didDelete.status === 'not-found') {
		return createNoStoreErrorResponse('session-not-found', 404);
	}

	return createNoStoreJsonResponse({ message: 'session-revoked' });
}
