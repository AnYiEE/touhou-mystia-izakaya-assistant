import { type NextRequest } from 'next/server';

import { type TAccountAuthResult } from '@/features/account/server/auth/requestAuthentication';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

type TAccountAuthError = Extract<TAccountAuthResult, { status: 'error' }>;

export function createServerMisconfiguredResponse() {
	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function createAccountAuthErrorRouteResponse(
	auth: TAccountAuthError,
	request: NextRequest
) {
	void request;

	return createNoStoreErrorResponse(auth.message, auth.httpStatus);
}
