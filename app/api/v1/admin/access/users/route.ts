import { type NextRequest } from 'next/server';

import { checkUserStatus } from '@/features/account/server/presentation/user';
import { listAdminFeatureAccessUsers } from '@/features/featureAccess/admin/server/service';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';
import { checkAdminPagination } from '@/features/admin/server/pagination';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
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

export async function GET(request: NextRequest) {
	const guard = await checkAdminRequest(request, 'admin-feature-users');
	if (guard.status === 'error') {
		return guard.response;
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
	if (
		page === null ||
		pageSize === null ||
		!checkAdminPagination({ page, pageSize })
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidPagination,
			400
		);
	}
	const status = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'status'
	);
	if (status !== undefined && !checkUserStatus(status)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

	return createNoStoreJsonResponse(
		await listAdminFeatureAccessUsers({
			limit: pageSize,
			offset: (page - 1) * pageSize,
			query,
			...(status === undefined ? {} : { status }),
		})
	);
}
