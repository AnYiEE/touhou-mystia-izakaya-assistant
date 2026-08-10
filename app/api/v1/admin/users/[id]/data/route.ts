import { type NextRequest } from 'next/server';

import {
	ACCOUNT_SYNC_STATUS_MAP,
	USER_STATUS_MAP,
} from '@/domain/account/contracts';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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
		'admin-clear-user-data',
		'',
		{ parts: [{ name: 'target-user', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = await authenticateAdminFromRequest(request);
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

	const [userStateModule, usersModule, accountAuditModule] =
		await Promise.all([
			import('@/features/account/sync/server'),
			import('@/features/account/server/persistence/repositories/users'),
			import('@/features/account/server/audit/service'),
		]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.targetUserNotFound,
			404
		);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidUserStatus,
			403
		);
	}

	try {
		const syncState =
			await userStateModule.clearUserDataAndDeleteSessionsAndIncrementStateEpochWithAudit(
				id,
				user.state_epoch,
				user.sync_generation,
				(trx, auditNow, nextStateEpoch, nextSyncGeneration) =>
					accountAuditModule.writeAccountAuditLogInTransaction(
						trx,
						accountAuditModule.createAccountAdminAuditLogInput({
							action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
								.adminClearUserData,
							adminId: auth.actorId,
							metadata: {
								state_epoch: nextStateEpoch,
								sync_generation: nextSyncGeneration,
								sync_status:
									ACCOUNT_SYNC_STATUS_MAP.pausedEmpty,
								target_nickname: user.nickname,
								target_user_id: id,
								target_username: user.username,
							},
							request,
							targetId: id,
							targetType: 'user',
						}),
						auditNow
					)
			);

		return createNoStoreJsonResponse(syncState);
	} catch (error) {
		if (Error.isError(error)) {
			if (error.message === 'user-not-found') {
				return createNoStoreErrorResponse(
					ACCOUNT_API_RESPONSE_CODE_MAP.targetUserNotFound,
					404
				);
			}
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse(
					ACCOUNT_API_RESPONSE_CODE_MAP.invalidUserStatus,
					403
				);
			}
			if (error.message === 'update-not-applied') {
				return createNoStoreErrorResponse(
					ACCOUNT_API_RESPONSE_CODE_MAP.updateNotApplied,
					409
				);
			}
		}

		throw error;
	}
}
