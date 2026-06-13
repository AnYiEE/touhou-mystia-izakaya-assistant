import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/lib/announcements/server/adminRouteResponses';
import {
	ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP,
	listAdminAnnouncementVersions,
} from '@/lib/announcements/server/service';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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
	const result = await listAdminAnnouncementVersions(id);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
