import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import type { TUserStatus } from '@/lib/account/shared/types';
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

type TAdminSsoClientStatusFilter = 'active' | 'disabled';

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-grants'
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
	const clientId = getTrimmedSearchParam(request, 'client_id');
	const clientStatus = getTrimmedSearchParam(request, 'client_status') as
		| TAdminSsoClientStatusFilter
		| undefined;
	const query = getTrimmedSearchParam(request, 'query');
	const userId = getTrimmedSearchParam(request, 'user_id');
	const userStatus = getTrimmedSearchParam(request, 'user_status') as
		| TUserStatus
		| undefined;

	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantService');
	const result = await serviceModule.listAdminSsoGrantRelations({
		page,
		pageSize,
		...(clientId === undefined ? {} : { clientId }),
		...(clientStatus === undefined ? {} : { clientStatus }),
		...(query === undefined ? {} : { query }),
		...(userId === undefined ? {} : { userId }),
		...(userStatus === undefined ? {} : { userStatus }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_GRANT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
