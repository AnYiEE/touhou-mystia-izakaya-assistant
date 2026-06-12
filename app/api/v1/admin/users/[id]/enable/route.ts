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
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/api/v1/admin/utils';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
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
		'admin-enable-user'
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

	const csrfResponse = checkAdminCsrfResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const { id } = await params;
	const usersModule = await import('@/lib/account/server/repositories/users');
	const isUpdated = await usersModule.setUserStatusIfCurrentStatus(
		id,
		USER_STATUS_MAP.disabled,
		USER_STATUS_MAP.active
	);
	if (isUpdated) {
		return createNoStoreJsonResponse({ message: 'user-enabled' });
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createNoStoreErrorResponse('user-deleted', 403);
	}
	if (user.status !== USER_STATUS_MAP.disabled) {
		return createNoStoreErrorResponse('update-not-applied', 409);
	}

	return createNoStoreErrorResponse('update-not-applied', 409);
}
