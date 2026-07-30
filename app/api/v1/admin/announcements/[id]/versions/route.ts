import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/features/announcements/server/admin/http/requestGuard';
import { ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP } from '@/features/announcements/server/http/serviceErrorStatus';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-list-announcement-versions'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const announcementModule =
		await import('@/features/announcements/server/admin/service');
	const result = await announcementModule.listAdminAnnouncementVersions(id);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
