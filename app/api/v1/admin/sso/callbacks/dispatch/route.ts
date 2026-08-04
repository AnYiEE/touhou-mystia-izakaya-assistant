import { type NextRequest } from 'next/server';

import { ADMIN_SSO_API_RESPONSE_CODE_MAP } from '@/features/account/sso/admin/apiResponseCodes';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const check = await checkAdminRequest(
		request,
		'admin-dispatch-sso-callbacks',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	try {
		const ssoModule = await import('@/features/account/sso/server');
		const result = await ssoModule.dispatchSsoCallbacks(
			ssoModule.SSO_CALLBACK_DISPATCH_LIMIT
		);
		let ticketsDeleted = 0;
		try {
			ticketsDeleted = await ssoModule.deleteExpiredSsoTickets();
		} catch (error) {
			console.warn(
				'Admin SSO expired ticket cleanup failed after dispatch.',
				{ errorCode: getLogSafeErrorCode(error) }
			);
		}

		const auditModule =
			await import('@/features/account/admin/server/audit/service');
		const auditResult = await auditModule.writeAdminAuditLog({
			action: 'admin-dispatch-sso-callbacks',
			actorId: check.auth.actorId,
			actorType: 'admin',
			metadata: {
				deleted_expired_tickets: ticketsDeleted,
				deleted_final_failed_callbacks:
					result.deleted_final_failed_callbacks,
				failed: result.failed,
				final_failed: result.final_failed,
				succeeded: result.succeeded,
			},
			scope: 'sso',
			targetId: null,
			targetType: 'sso_callback_queue',
			...getRequestAuditContext(request),
		});
		if (auditResult.status === 'error') {
			return createNoStoreErrorResponse(auditResult.error, 400);
		}

		return createNoStoreJsonResponse({
			...result,
			deleted_expired_tickets: ticketsDeleted,
			message: ADMIN_SSO_API_RESPONSE_CODE_MAP.callbacksDispatched,
		});
	} catch (error) {
		console.warn('Admin SSO callback dispatch failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
	}
}
