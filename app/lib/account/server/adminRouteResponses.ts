import { type NextRequest } from 'next/server';

import { getAdminSessionToken } from '@/lib/account/server/admin';
import {
	authenticateAdminSessionToken,
	checkAdminCsrfGuard,
	checkAdminFeatureGuard,
} from '@/lib/account/server/guards';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';

export function checkAdminFeatureRouteResponse() {
	const result = checkAdminFeatureGuard();
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}

export function authenticateAdminFromRequest(request: NextRequest) {
	const result = authenticateAdminSessionToken(getAdminSessionToken(request));
	return result.status === 'ok'
		? { ...result.data, status: 'ok' as const }
		: result;
}

export function createAdminAuthErrorRouteResponse(
	request: NextRequest,
	message: string,
	httpStatus: number
) {
	void request;

	return createNoStoreErrorResponse(message, httpStatus);
}

export function checkAdminCsrfRouteResponse(
	request: NextRequest,
	token: string
) {
	const result = checkAdminCsrfGuard(
		request.headers.get('x-csrf-token'),
		token
	);
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}
