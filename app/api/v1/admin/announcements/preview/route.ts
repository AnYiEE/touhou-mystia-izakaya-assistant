import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/lib/announcements/server/adminRouteResponses';
import { parseAdminAnnouncementBody } from '@/lib/announcements/server/adminPayload';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-preview-announcement',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

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
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = announcementModule.previewAnnouncement(body);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			announcementModule.ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
