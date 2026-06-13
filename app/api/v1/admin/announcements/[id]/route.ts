import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/lib/announcements/server/adminRouteResponses';
import { parseAdminAnnouncementBody } from '@/lib/announcements/server/adminPayload';
import {
	ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP,
	archiveAdminAnnouncement,
	getAdminAnnouncement,
	restoreAdminAnnouncement,
	updateAdminAnnouncement,
} from '@/lib/announcements/server/service';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-announcement-detail'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const result = await getAdminAnnouncement(id);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-update-announcement',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const bodyResult = await readJsonBodyResult(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseAdminAnnouncementBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body?.id !== id) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const result = await updateAdminAnnouncement(id, body, check.username);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-archive-announcement',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const result = await archiveAdminAnnouncement(id, check.username);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-restore-announcement',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const result = await restoreAdminAnnouncement(id, check.username);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
