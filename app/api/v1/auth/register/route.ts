import { type NextRequest } from 'next/server';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

	const bodyResult =
		await readJsonBodyResult<Record<string, unknown>>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const usernameValue = body?.['username'];
	const passwordValue = body?.['password'];
	const nicknameValue = body?.['nickname'];
	if (
		typeof usernameValue !== 'string' ||
		typeof passwordValue !== 'string' ||
		(nicknameValue !== undefined &&
			typeof nicknameValue !== 'string' &&
			nicknameValue !== null)
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const [passwordModule, userModule, registerModule] = await Promise.all([
		import('@/features/account/server/auth/password'),
		import('@/features/account/server/presentation/user'),
		import('@/features/account/server/useCases/registerWithPassword'),
	]);

	const username = usernameValue.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidUsername,
			400
		);
	}
	if (!passwordModule.checkPasswordPolicy(passwordValue)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidPasswordRule,
			400
		);
	}
	const nickname =
		nicknameValue === undefined || nicknameValue === null
			? null
			: userModule.normalizeNickname(nicknameValue);
	if (!userModule.checkNicknamePolicy(nickname)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidNickname,
			400
		);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'register',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const result = await registerModule.registerWithPassword({
		nickname,
		password: passwordValue,
		request,
		username,
		usernameNormalized,
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.message,
			result.message === 'username-conflict' ? 409 : 500
		);
	}
	const loginResponseModule =
		await import('@/features/account/server/http/loginResponse');
	return loginResponseModule.createAccountLoginSuccessResponse({
		hasPassword: true,
		passwordMustChange: false,
		request,
		session: result.session,
		user: userModule.createAccountUserProfile(result.user),
	});
}
