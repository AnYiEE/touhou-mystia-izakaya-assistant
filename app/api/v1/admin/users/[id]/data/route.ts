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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
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
		'admin-clear-user-data'
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
	const userStateModule = await import('@/actions/account/userState');

	try {
		const stateEpoch =
			await userStateModule.clearUserDataAndDeleteSessionsAndIncrementStateEpoch(
				id
			);

		return createNoStoreJsonResponse({ state_epoch: stateEpoch });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return createNoStoreErrorResponse('target-user-not-found', 404);
			}
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse('invalid-user-status', 403);
			}
			if (error.message === 'update-not-applied') {
				return createNoStoreErrorResponse('update-not-applied', 409);
			}
		}

		throw error;
	}
}
