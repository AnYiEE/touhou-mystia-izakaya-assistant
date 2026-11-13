import { type NextRequest } from 'next/server';

import { type TAccountAuthResult } from '@/features/account/server/auth/requestAuthentication';
import { clearAccountSessionCookie } from '@/features/account/server/auth/sessionLifecycle';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

type TAccountAuthError = Extract<TAccountAuthResult, { status: 'error' }>;

export function createServerMisconfiguredResponse() {
	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function createAccountAuthErrorRouteResponse(
	auth: TAccountAuthError,
	request: NextRequest,
	options: { clearSessionCookie?: boolean } = {}
) {
	const response = createNoStoreErrorResponse(
		auth.message,
		auth.httpStatus,
		auth.data
	);
	if (options.clearSessionCookie === true) {
		clearAccountSessionCookie(response, request);
	}

	return response;
}
