import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminFromRequest,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/lib/account/server/adminRouteResponses';
import { type IListUsersOptions } from '@/lib/account/server/repositories/users';
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

	const auth = authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/user'),
	]);

	const rawStatus = request.nextUrl.searchParams.get('status');
	const status =
		rawStatus === null || rawStatus.trim() === '' ? null : rawStatus.trim();
	if (status !== null && !userModule.checkUserStatus(status)) {
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

	if (status !== null) {
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
