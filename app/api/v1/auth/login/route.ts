import { type NextRequest } from 'next/server';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import type { IAuthLoginBody } from '@/features/account/contracts';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVALID_LOGIN_MESSAGE = 'invalid-credentials';

function createInvalidLoginResponse() {
	return createNoStoreErrorResponse(INVALID_LOGIN_MESSAGE, 401);
}

function createCredentialLockedResponse(retryAfter: number) {
	return createNoStoreErrorResponse(
		HTTP_API_RESPONSE_CODE_MAP.tooManyRequests,
		429,
		{ retry_after: retryAfter },
		{ headers: createRetryAfterHeaders(retryAfter) }
	);
}

function createCredentialStateStaleResponse() {
	return createNoStoreErrorResponse(
		ACCOUNT_API_RESPONSE_CODE_MAP.credentialStateStale,
		409
	);
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const bodyResult = await readJsonBodyResult<IAuthLoginBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.username !== 'string' ||
		typeof body.password !== 'string'
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const [userModule, loginModule] = await Promise.all([
		import('@/features/account/server/presentation/user'),
		import('@/features/account/server/useCases/loginWithPassword'),
	]);

	const username = body.username.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidUsername,
			400
		);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'login',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const result = await loginModule.loginWithPassword({
		password: body.password,
		request,
		username,
		usernameNormalized,
	});
	if (result.status === 'locked') {
		return createCredentialLockedResponse(result.retryAfter);
	}
	if (result.status === 'error') {
		if (result.message === 'credential-state-stale') {
			return createCredentialStateStaleResponse();
		}
		if (result.message === 'user-disabled') {
			return createNoStoreErrorResponse(
				ACCOUNT_API_RESPONSE_CODE_MAP.userDisabled,
				403
			);
		}
		if (result.message === 'user-deleted') {
			return createNoStoreErrorResponse(
				ACCOUNT_API_RESPONSE_CODE_MAP.userDeleted,
				403
			);
		}
		return createInvalidLoginResponse();
	}
	const loginResponseModule =
		await import('@/features/account/server/http/loginResponse');

	return loginResponseModule.createAccountLoginSuccessResponse({
		hasPassword: true,
		passwordMustChange: result.passwordMustChange,
		request,
		session: result.session,
		user: userModule.createAccountUserProfile(result.user),
	});
}
