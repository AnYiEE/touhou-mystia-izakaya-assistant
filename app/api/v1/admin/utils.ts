import { type NextRequest } from 'next/server';

import {
	checkAdminFeatureEnabled,
	getAdminSessionToken,
	verifyAdminCsrfToken,
	verifyAdminSessionToken,
} from '@/lib/account/server/admin';
import { createNoStoreErrorResponse } from '@/api/v1/utils';

export function checkAdminFeatureResponse() {
	if (checkAdminFeatureEnabled()) {
		return null;
	}

	return createNoStoreErrorResponse('feature-disabled', 404);
}

export function authenticateAdminRequest(request: NextRequest) {
	const token = getAdminSessionToken(request);
	if (token === null) {
		return {
			httpStatus: 401,
			message: 'unauthorized',
			status: 'error' as const,
		};
	}

	const payload = verifyAdminSessionToken(token);
	if (payload === null) {
		return {
			httpStatus: 401,
			message: 'admin-session-expired',
			status: 'error' as const,
		};
	}

	return { payload, status: 'ok' as const, token };
}

export function createAdminAuthErrorResponse(
	request: NextRequest,
	message: string,
	httpStatus: number
) {
	void request;

	return createNoStoreErrorResponse(message, httpStatus);
}

export function checkAdminCsrfResponse(request: NextRequest, token: string) {
	if (verifyAdminCsrfToken(request, token)) {
		return null;
	}

	return createNoStoreErrorResponse('forbidden', 403);
}
