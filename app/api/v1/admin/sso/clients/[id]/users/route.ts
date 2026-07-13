import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { parsePositiveIntegerParam } from '@/lib/api/adminPagination';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-client-users',
		{ parts: [{ name: 'client', value: id }] }
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

	const query = request.nextUrl.searchParams.get('query')?.trim();
	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantService');
	const result = await serviceModule.listAdminSsoClientUsers(id, {
		page,
		pageSize,
		...(query === undefined || query === '' ? {} : { query }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_GRANT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
