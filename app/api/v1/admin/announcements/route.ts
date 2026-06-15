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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

function parsePositiveIntegerParam(
	value: string | null,
	defaultValue: number,
	maxValue: number
) {
	if (value === null) {
		return defaultValue;
	}
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);
	if (
		!Number.isSafeInteger(parsedValue) ||
		parsedValue < 1 ||
		parsedValue > maxValue
	) {
		return null;
	}

	return parsedValue;
}

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
	const query = request.nextUrl.searchParams.get('query') ?? '';

	const announcementModule =
		await import('@/lib/announcements/server/service');
	return createNoStoreJsonResponse(
		await announcementModule.listAdminAnnouncements({
			includeArchived,
			page,
			pageSize,
			query,
		})
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
		check.username
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
