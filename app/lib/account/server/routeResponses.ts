import { type NextRequest } from 'next/server';

import {
	type TAccountGuardResult,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkSameOrigin,
} from '@/lib/account/server/guards';
import { SERVER_MISCONFIGURED_MESSAGE } from '@/lib/account/server/environment';
import { MAX_ACCOUNT_SMALL_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	readJsonBodyResult as readApiJsonBodyResult,
} from '@/lib/api/routeResponses';

type TAccountAuthError = Extract<
	Awaited<
		ReturnType<
			(typeof import('@/lib/account/server/auth'))['authenticateAccountRequest']
		>
	>,
	{ status: 'error' }
>;
type TAccountGuardError = Extract<TAccountGuardResult, { status: 'error' }>;

function createGuardErrorResponse(error: TAccountGuardError) {
	return createNoStoreErrorResponse(
		error.message,
		error.httpStatus,
		error.data,
		error.headers === undefined ? undefined : { headers: error.headers }
	);
}

export async function checkAccountFeatureResponse() {
	const result = await checkAccountFeature();

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkSameOriginResponse(request: NextRequest) {
	const result = checkSameOrigin(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountCookieSecurityResponse(request: NextRequest) {
	const result = checkAccountCookieSecurity(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountRateLimitResponse(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: { noTrustedIpGate?: boolean } = {}
) {
	const result = checkAccountRateLimit(
		request,
		scope,
		usernameNormalized,
		options
	);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export async function readJsonBodyResult<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
) {
	return readApiJsonBodyResult<T>(request, maxBytes);
}

export async function readJsonBody<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
) {
	const result = await readJsonBodyResult<T>(request, maxBytes);

	return result.status === 'ok' ? result.data : null;
}

export function createServerMisconfiguredResponse() {
	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function createAccountAuthErrorResponse(
	auth: TAccountAuthError,
	request: NextRequest
) {
	void request;

	return createNoStoreErrorResponse(auth.message, auth.httpStatus);
}
