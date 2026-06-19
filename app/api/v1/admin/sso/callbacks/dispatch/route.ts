import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-dispatch-sso-callbacks',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	try {
		const ssoModule = await import('@/lib/account/server/sso');
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
			await import('@/lib/account/server/adminAuditService');
		const auditResult = await auditModule.writeAdminAuditLog({
			action: 'admin-dispatch-sso-callbacks',
			actorId: check.auth.payload.username,
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
			message: 'sso-callbacks-dispatched',
		});
	} catch (error) {
		console.warn('Admin SSO callback dispatch failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
