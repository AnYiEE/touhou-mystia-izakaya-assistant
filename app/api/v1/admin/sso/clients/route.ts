import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
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

function parseBooleanFilter(value: string | null) {
	if (value === null || value === '') {
		return;
	}
	if (value === '1' || value === 'true') {
		return true;
	}
	if (value === '0' || value === 'false') {
		return false;
	}

	return null;
}

function parseCallbackFilter(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return value === 'configured' || value === 'missing' ? value : null;
}

function parseStatusFilter(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return value === 'active' || value === 'disabled' ? value : null;
}

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-clients'
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
	const hasGrants = parseBooleanFilter(
		request.nextUrl.searchParams.get('has_grants')
	);
	if (page === null || pageSize === null || hasGrants === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const callback = parseCallbackFilter(
		getTrimmedSearchParam(request, 'callback')
	);
	const query = getTrimmedSearchParam(request, 'query');
	const status = parseStatusFilter(getTrimmedSearchParam(request, 'status'));
	if (callback === null || status === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	const result = await serviceModule.listAdminSsoClients({
		page,
		pageSize,
		...(callback === undefined ? {} : { callback }),
		...(hasGrants === undefined ? {} : { hasGrants }),
		...(query === undefined ? {} : { query }),
		...(status === undefined ? {} : { status }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function POST(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-create-sso-client',
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

	const payloadModule =
		await import('@/lib/account/server/adminSsoClientPayload');
	const body = payloadModule.parseAdminSsoClientCreateBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.createAdminSsoClient(body, {
		adminId: check.auth.actorId,
		...getRequestAuditContext(request),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data, 201);
}
