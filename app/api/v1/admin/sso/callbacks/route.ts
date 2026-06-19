import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { SSO_CALLBACK_EVENT_LIST } from '@/lib/account/shared/constants';
import type {
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
} from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
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

function parseNonNegativeIntegerParam(value: string | null) {
	if (value === null) {
		return;
	}
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

function parseCallbackEvent(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return SSO_CALLBACK_EVENT_LIST.includes(value as TAdminSsoCallbackEvent)
		? (value as TAdminSsoCallbackEvent)
		: null;
}

function parseQueueStatus(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return ['final_failed', 'pending', 'retrying'].includes(value)
		? (value as TAdminSsoCallbackQueueStatus)
		: null;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
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

	const clientId = getTrimmedSearchParam(request, 'client_id');
	const event = parseCallbackEvent(getTrimmedSearchParam(request, 'event'));
	const query = getTrimmedSearchParam(request, 'query');
	const status = parseQueueStatus(getTrimmedSearchParam(request, 'status'));
	const userId = getTrimmedSearchParam(request, 'user_id');
	if (event === null || status === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoCallbackService');
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
