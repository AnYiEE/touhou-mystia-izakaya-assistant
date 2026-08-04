import { type NextRequest } from 'next/server';

import { type TSsoActorType } from '@/domain/account/contracts';

import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	getTrimmedSearchParam,
	parseNonNegativeIntegerParam,
	parsePositiveIntegerParam,
} from '@/infrastructure/http/queryParameters';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_AUDIT_LOG_OFFSET = 5000;
const MAX_PAGE = 250;
const MAX_PAGE_SIZE = 100;
const MIN_AUDIT_LOG_QUERY_LENGTH = 2;

function parseActorType(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return ['admin', 'client', 'system', 'user'].includes(value)
		? (value as TSsoActorType)
		: null;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminRequest(request, 'admin-list-audit-logs');
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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const action = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'action'
	);
	const actorId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'actor_id'
	);
	const actorType = parseActorType(
		getTrimmedSearchParam(request.nextUrl.searchParams, 'actor_type')
	);
	const query = getTrimmedSearchParam(request.nextUrl.searchParams, 'query');
	const scope = getTrimmedSearchParam(request.nextUrl.searchParams, 'scope');
	const targetId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'target_id'
	);
	const targetType = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'target_type'
	);
	if (actorType === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	if (query !== undefined && query.length < MIN_AUDIT_LOG_QUERY_LENGTH) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const serviceModule =
		await import('@/features/account/admin/server/audit/service');
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
