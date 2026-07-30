import { type NextRequest } from 'next/server';

import { type TUserStatus } from '@/domain/account/contracts';

import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import {
	getTrimmedSearchParam,
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

type TAdminSsoClientStatusFilter = 'active' | 'disabled';

export async function GET(request: NextRequest) {
	const check = await checkAdminRequest(request, 'admin-list-sso-grants');
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
	const clientId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'client_id'
	);
	const clientStatus = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'client_status'
	) as TAdminSsoClientStatusFilter | undefined;
	const query = getTrimmedSearchParam(request.nextUrl.searchParams, 'query');
	const userId = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'user_id'
	);
	const userStatus = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'user_status'
	) as TUserStatus | undefined;

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantService');
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
