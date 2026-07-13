import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import type { TAdminSsoGrantEvent } from '@/lib/account/shared/types';
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
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-grant-events'
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
		endTime === null
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const actorId = getTrimmedSearchParam(request, 'actor_id');
	const actorType = getTrimmedSearchParam(request, 'actor_type') as
		| TSsoActorType
		| undefined;
	const clientId = getTrimmedSearchParam(request, 'client_id');
	const event = getTrimmedSearchParam(request, 'event') as
		| TAdminSsoGrantEvent
		| undefined;
	const query = getTrimmedSearchParam(request, 'query');
	const userId = getTrimmedSearchParam(request, 'user_id');

	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantEventService');
	const result = await serviceModule.listAdminSsoGrantEventRecords({
		page,
		pageSize,
		...(actorId === undefined ? {} : { actorId }),
		...(actorType === undefined ? {} : { actorType }),
		...(clientId === undefined ? {} : { clientId }),
		...(endTime === undefined ? {} : { endTime }),
		...(event === undefined ? {} : { event }),
		...(query === undefined ? {} : { query }),
		...(startTime === undefined ? {} : { startTime }),
		...(userId === undefined ? {} : { userId }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_GRANT_EVENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
