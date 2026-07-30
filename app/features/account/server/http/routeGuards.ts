import { type NextRequest } from 'next/server';

import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

import {
	type TAccountGuardResult,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkSameOriginGuard,
} from './guards';

type TAccountGuardError = Extract<TAccountGuardResult, { status: 'error' }>;

function createGuardErrorResponse(error: TAccountGuardError) {
	return createNoStoreErrorResponse(
		error.message,
		error.httpStatus,
		error.data,
		error.headers === undefined ? undefined : { headers: error.headers }
	);
}

export async function checkAccountFeatureRouteResponse() {
	const result = await checkAccountFeatureGuard();

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkSameOriginRouteResponse(request: NextRequest) {
	const result = checkSameOriginGuard(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountCookieSecurityRouteResponse(request: NextRequest) {
	const result = checkAccountCookieSecurityGuard(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountRateLimitRouteResponse(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: Parameters<typeof checkAccountRateLimitGuard>[3] = {}
) {
	const result = checkAccountRateLimitGuard(
		request,
		scope,
		usernameNormalized,
		options
	);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountPreAuthRateLimitRouteResponse(
	request: NextRequest,
	scope: string
) {
	return checkAccountRateLimitRouteResponse(
		request,
		`pre-auth:${scope}`,
		'',
		{ noTrustedIpGate: true }
	);
}
