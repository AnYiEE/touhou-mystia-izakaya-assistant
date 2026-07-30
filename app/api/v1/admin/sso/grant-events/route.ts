import { type NextRequest } from 'next/server';

import { type TSsoActorType } from '@/domain/account/contracts';

import type { TAdminSsoGrantEvent } from '@/features/account/contracts';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

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
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
	const check = await checkAdminRequest(
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

	const actorId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'actor_id'
	);
	const actorType = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'actor_type'
	) as TSsoActorType | undefined;
	const clientId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'client_id'
	);
	const event = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'event'
	) as TAdminSsoGrantEvent | undefined;
	const query = getTrimmedSearchParam(request.nextUrl.searchParams, 'query');
	const userId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'user_id'
	);

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantEventService');
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
