import { type NextRequest } from 'next/server';

import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

import { checkAdminCsrfGuard, checkAdminFeatureGuard } from './guards';

export function checkAdminFeatureRouteResponse() {
	const result = checkAdminFeatureGuard();
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
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
