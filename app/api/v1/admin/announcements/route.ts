import { type NextRequest } from 'next/server';

import { checkAdminAnnouncementRequest } from '@/lib/announcements/server/adminRouteResponses';
import { parseAdminAnnouncementBody } from '@/lib/announcements/server/adminPayload';
import {
	checkAnnouncementAudience,
	checkAnnouncementComputedStatus,
	checkAnnouncementLevel,
} from '@/lib/announcements/shared/types';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import { parsePositiveIntegerParam } from '@/lib/api/adminPagination';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-list-announcements'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const page = parsePositiveIntegerParam(
		request.nextUrl.searchParams.get('page'),
		1,
		MAX_PAGE
	);
	const pageSize = parsePositiveIntegerParam(
		request.nextUrl.searchParams.get('page_size'),
		DEFAULT_PAGE_SIZE,
		MAX_PAGE_SIZE
	);
	if (page === null || pageSize === null) {
		return createNoStoreErrorResponse('invalid-pagination', 400);
	}

	const includeArchived =
		request.nextUrl.searchParams.get('include_archived') === '1';
	const rawAudience = request.nextUrl.searchParams.get('audience') ?? '';
	const rawComputedStatus = request.nextUrl.searchParams.get('status') ?? '';
	const rawLevel = request.nextUrl.searchParams.get('level') ?? '';
	const query = request.nextUrl.searchParams.get('query') ?? '';
	if (
		(rawAudience !== '' && !checkAnnouncementAudience(rawAudience)) ||
		(rawComputedStatus !== '' &&
			!checkAnnouncementComputedStatus(rawComputedStatus)) ||
		(rawLevel !== '' && !checkAnnouncementLevel(rawLevel))
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const options: Parameters<
		typeof announcementModule.listAdminAnnouncements
	>[0] = { includeArchived, page, pageSize, query };
	if (rawAudience !== '') {
		options.audience = rawAudience;
	}
	if (rawComputedStatus !== '') {
		options.computedStatus = rawComputedStatus;
	}
	if (rawLevel !== '') {
		options.level = rawLevel;
	}

	return createNoStoreJsonResponse(
		await announcementModule.listAdminAnnouncements(options)
	);
}

export async function POST(request: NextRequest) {
	const check = await checkAdminAnnouncementRequest(
		request,
		'admin-create-announcement',
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
	const result = await announcementModule.createAdminAnnouncement(
		body,
		check.actorId
	);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			announcementModule.ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data, 201);
}
