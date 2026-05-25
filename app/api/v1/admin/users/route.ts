import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { type IListUsersOptions } from '@/actions/account/users';
import {
	authenticateAdminRequest,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '../utils';

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
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-list-users'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/actions/account/users'),
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

	const users = await usersModule.listUsers(listUsersOptions);

	return createNoStoreJsonResponse({
		page,
		page_size: pageSize,
		users: users.map(userModule.createAccountUserProfile),
	});
}
