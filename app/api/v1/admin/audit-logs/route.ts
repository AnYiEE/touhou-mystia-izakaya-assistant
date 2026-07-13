import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import {
	parseNonNegativeIntegerParam,
	parsePositiveIntegerParam,
} from '@/lib/api/adminPagination';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { type TSsoActorType } from '@/lib/db/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_AUDIT_LOG_OFFSET = 5000;
const MAX_PAGE = 250;
const MAX_PAGE_SIZE = 100;
const MIN_AUDIT_LOG_QUERY_LENGTH = 2;

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

function parseActorType(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return ['admin', 'client', 'system', 'user'].includes(value)
		? (value as TSsoActorType)
		: null;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-audit-logs'
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
	const startTime = parseNonNegativeIntegerParam(
		request.nextUrl.searchParams.get('start_time')
	);
	const endTime = parseNonNegativeIntegerParam(
		request.nextUrl.searchParams.get('end_time')
	);
	if (
		page === null ||
		pageSize === null ||
		startTime === null ||
		endTime === null ||
		(page - 1) * pageSize > MAX_AUDIT_LOG_OFFSET
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const action = getTrimmedSearchParam(request, 'action');
	const actorId = getTrimmedSearchParam(request, 'actor_id');
	const actorType = parseActorType(
		getTrimmedSearchParam(request, 'actor_type')
	);
	const query = getTrimmedSearchParam(request, 'query');
	const scope = getTrimmedSearchParam(request, 'scope');
	const targetId = getTrimmedSearchParam(request, 'target_id');
	const targetType = getTrimmedSearchParam(request, 'target_type');
	if (actorType === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (query !== undefined && query.length < MIN_AUDIT_LOG_QUERY_LENGTH) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminAuditService');
	const result = await serviceModule.listAdminAuditLogs({
		page,
		pageSize,
		...(action === undefined ? {} : { action }),
		...(actorId === undefined ? {} : { actorId }),
		...(actorType === undefined ? {} : { actorType }),
		...(endTime === undefined ? {} : { endTime }),
		...(query === undefined ? {} : { query }),
		...(scope === undefined ? {} : { scope }),
		...(startTime === undefined ? {} : { startTime }),
		...(targetId === undefined ? {} : { targetId }),
		...(targetType === undefined ? {} : { targetType }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_AUDIT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
