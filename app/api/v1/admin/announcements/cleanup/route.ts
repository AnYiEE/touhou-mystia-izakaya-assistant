import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/features/announcements/server/admin/http/requestGuard';
import { ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP } from '@/features/announcements/server/http/serviceErrorStatus';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-cleanup-announcement-records',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	try {
		const [announcementModule, auditModule] = await Promise.all([
			import('@/features/announcements/server/admin/cleanup'),
			import('@/features/account/admin/server/audit/service'),
		]);
		const result = await announcementModule.cleanupAdminAnnouncementRecords(
			{ adminId: check.actorId, ...getRequestAuditContext(request) },
			auditModule.writeAdminAuditLogInTransaction
		);
		if (result.status === 'error') {
			return createNoStoreErrorResponse(
				result.error,
				ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
			);
		}

		return createNoStoreJsonResponse(result.data);
	} catch (error) {
		console.warn('Failed to clean up announcement records.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
	}
}
