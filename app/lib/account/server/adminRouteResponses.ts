import { type NextRequest } from 'next/server';

import { getAdminSessionToken } from '@/lib/account/server/admin';
import {
	authenticateAdminSession,
	checkAdminCsrf,
	checkAdminFeature,
} from '@/lib/account/server/guards';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';

export function checkAdminFeatureResponse() {
	const result = checkAdminFeature();
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}

export function authenticateAdminRequest(request: NextRequest) {
	const result = authenticateAdminSession(getAdminSessionToken(request));
	return result.status === 'ok'
		? { ...result.data, status: 'ok' as const }
		: result;
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
	const result = checkAdminCsrf(request.headers.get('x-csrf-token'), token);
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}
