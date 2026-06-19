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
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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
		'admin-restore-user',
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

	const [usersModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const isUpdated = await usersModule.setUserStatusIfCurrentStatusWithAudit(
		id,
		USER_STATUS_MAP.deleted,
		USER_STATUS_MAP.disabled,
		true,
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountAdminAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.adminRestoreUser,
					adminId: auth.payload.username,
					metadata: {
						next_status: USER_STATUS_MAP.disabled,
						previous_status: USER_STATUS_MAP.deleted,
						target_user_id: id,
					},
					request,
					targetId: id,
					targetType: 'user',
				}),
				auditNow
			)
	);
	if (isUpdated) {
		return createNoStoreJsonResponse({ message: 'user-restored' });
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}
	if (user.status !== USER_STATUS_MAP.deleted) {
		return createNoStoreErrorResponse('update-not-applied', 409);
	}

	return createNoStoreErrorResponse('update-not-applied', 409);
}
