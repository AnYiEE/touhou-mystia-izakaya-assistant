import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { parseAdminAnnouncementBody } from '@/features/announcements/server/admin/http/payload';
import { checkAdminAnnouncementRequest } from '@/features/announcements/server/admin/http/requestGuard';
import { ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP } from '@/features/announcements/server/http/serviceErrorStatus';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

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
	const announcementModule =
		await import('@/features/announcements/server/admin/service');
	const result = await announcementModule.getAdminAnnouncement(id);
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

	const announcementModule =
		await import('@/features/announcements/server/admin/service');
	const result = await announcementModule.updateAdminAnnouncement(
		id,
		body,
		check.actorId
	);
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
	const announcementModule =
		await import('@/features/announcements/server/admin/service');
	const result = await announcementModule.archiveAdminAnnouncement(
		id,
		check.actorId
	);
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
	const announcementModule =
		await import('@/features/announcements/server/admin/service');
	const result = await announcementModule.restoreAdminAnnouncement(
		id,
		check.actorId
	);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
