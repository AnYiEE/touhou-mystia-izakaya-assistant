import { type NextRequest } from 'next/server';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { type IListUsersOptions } from '@/features/account/server/persistence/repositories/users';

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
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureRouteResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'admin-list-users'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = await authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/presentation/user'),
	]);

	const status = getTrimmedSearchParam(
		request.nextUrl.searchParams,
		'status'
	);
	if (status !== undefined && !userModule.checkUserStatus(status)) {
		return createNoStoreErrorResponse('invalid-user-status', 400);
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

	const query = userModule.normalizeUsername(
		request.nextUrl.searchParams.get('query') ?? ''
	);
	const listUsersOptions: IListUsersOptions = {
		limit: pageSize,
		offset: (page - 1) * pageSize,
		query,
	};

	if (status !== undefined) {
		listUsersOptions.status = status;
	}

	const { totalCount, users } = await usersModule.listUsers(listUsersOptions);

	return createNoStoreJsonResponse({
		page,
		page_size: pageSize,
		total_count: totalCount,
		total_pages: Math.ceil(totalCount / pageSize),
		users: users.map(userModule.createAccountUserProfile),
	});
}
