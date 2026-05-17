import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { type IListUsersOptions } from '@/actions/account/users';
import { authenticateAdminRequest, checkAdminFeatureResponse } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/actions/account/users'),
		import('@/lib/account/server/user'),
	]);
	const status = request.nextUrl.searchParams.get('status');
	if (status !== null && !userModule.checkUserStatus(status)) {
		return createNoStoreErrorResponse('invalid-user-status', 400);
	}

	const page = Math.max(
		1,
		Number.parseInt(request.nextUrl.searchParams.get('page') ?? '1') || 1
	);
	const pageSize = Math.min(
		MAX_PAGE_SIZE,
		Math.max(
			1,
			Number.parseInt(
				request.nextUrl.searchParams.get('page_size') ??
					String(DEFAULT_PAGE_SIZE)
			) || DEFAULT_PAGE_SIZE
		)
	);
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
