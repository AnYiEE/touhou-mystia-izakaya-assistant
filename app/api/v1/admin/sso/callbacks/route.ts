import { type NextRequest } from 'next/server';

import type { TAdminSsoCallbackQueueStatus } from '@/features/account/contracts';
import { parseAdminSsoCallbackEventQuery } from '@/features/account/sso/admin/server/http/callbackEventQuery';
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

function parseQueueStatus(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return ['final_failed', 'pending', 'retrying'].includes(value)
		? (value as TAdminSsoCallbackQueueStatus)
		: null;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminRequest(
		request,
		'admin-list-sso-callback-queue'
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

	const clientId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'client_id'
	);
	const event = parseAdminSsoCallbackEventQuery(
		getTrimmedSearchParam(request.nextUrl.searchParams, 'event')
	);
	const query = getTrimmedSearchParam(request.nextUrl.searchParams, 'query');
	const status = parseQueueStatus(
		getTrimmedSearchParam(request.nextUrl.searchParams, 'status')
	);
	const userId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'user_id'
	);
	if (event === null || status === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/callbackService');
	const result = await serviceModule.listAdminSsoCallbackQueueRecords({
		page,
		pageSize,
		...(clientId === undefined ? {} : { clientId }),
		...(endTime === undefined ? {} : { endTime }),
		...(event === undefined ? {} : { event }),
		...(query === undefined ? {} : { query }),
		...(startTime === undefined ? {} : { startTime }),
		...(status === undefined ? {} : { status }),
		...(userId === undefined ? {} : { userId }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CALLBACK_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
