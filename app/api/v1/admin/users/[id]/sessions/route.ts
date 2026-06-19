import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminFromRequest,
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/lib/account/server/adminRouteResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureRouteResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
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
		'admin-delete-user-sessions',
		'',
		{ parts: [{ name: 'target-user', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const csrfResponse = checkAdminCsrfRouteResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const [usersModule, sessionsModule, accountAuditModule] = await Promise.all(
		[
			import('@/lib/account/server/repositories/users'),
			import('@/lib/account/server/repositories/sessions'),
			import('@/lib/account/server/accountAuditService'),
		]
	);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}

	await sessionsModule.deleteSessionsByUserIdWithAudit(
		id,
		{},
		(trx, auditNow, deletedSessionCount) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountAdminAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.adminDeleteUserSessions,
					adminId: auth.payload.username,
					metadata: {
						deleted_record_count: deletedSessionCount,
						target_user_id: id,
					},
					request,
					targetId: id,
					targetType: 'user',
				}),
				auditNow
			)
	);

	return createNoStoreJsonResponse({ message: 'sessions-deleted' });
}
