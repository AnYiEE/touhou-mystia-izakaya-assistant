import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/lib/announcements/server/adminRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

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
		const announcementModule =
			await import('@/lib/announcements/server/service');
		const result = await announcementModule.cleanupAdminAnnouncementRecords(
			{ adminId: check.actorId, ...getRequestAuditContext(request) }
		);
		if (result.status === 'error') {
			return createNoStoreErrorResponse(
				result.error,
				announcementModule.ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[
					result.error
				]
			);
		}

		return createNoStoreJsonResponse(result.data);
	} catch (error) {
		console.warn('Failed to clean up announcement records.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
