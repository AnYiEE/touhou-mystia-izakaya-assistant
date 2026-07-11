import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
import { checkSsoClientId } from '@/lib/account/server/ssoValidation';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ clientId: string }> }
) {
	const { clientId } = await params;

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
		'account-revoke-sso-grant'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	if (!checkSsoClientId(clientId)) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-revoke-sso-grant',
		'',
		{ parts: [{ name: 'client', value: clientId }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [ssoRepository, auditModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/sso'),
		import('@/lib/account/server/adminAuditService'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const deleteResult =
		await ssoRepository.deleteSsoUserClientGrantForActiveSession(
			auth.data.user.id,
			clientId,
			{
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
			async (trx, auditNow) => {
				await auditModule.writeAdminAuditLogInTransaction(
					trx,
					{
						action: 'user-revoke-sso-grant',
						actorId: auth.data.user.id,
						actorType: 'user',
						metadata: {
							client_id: clientId,
							nickname: auth.data.user.nickname,
							reason: 'user-revoke-grant',
							user_id: auth.data.user.id,
							username: auth.data.user.username,
						},
						scope: 'sso',
						targetId: `${clientId}:${auth.data.user.id}`,
						targetType: 'sso_grant',
						...getRequestAuditContext(request),
					},
					auditNow
				);
				await accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.ssoGrantRevoked,
						metadata: {
							client_id: clientId,
							nickname: auth.data.user.nickname,
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				);
			}
		);
	if (deleteResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (deleteResult.status === 'not-found') {
		return createNoStoreErrorResponse('sso-grant-not-found', 404);
	}

	return createNoStoreJsonResponse({ message: 'sso-grant-revoked' });
}
