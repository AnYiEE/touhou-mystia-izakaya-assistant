import isObject from 'lodash/isObject.js';
import { type NextRequest } from 'next/server';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import type { IAccountProfileUpdateBody } from '@/features/account/contracts';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'account-profile-update'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IAccountProfileUpdateBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (!isObject(body)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	const bodyRecord = body as Record<string, unknown>;
	if (
		bodyRecord['username'] !== undefined &&
		typeof bodyRecord['username'] !== 'string'
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	if (
		bodyRecord['nickname'] !== undefined &&
		typeof bodyRecord['nickname'] !== 'string' &&
		bodyRecord['nickname'] !== null
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	if (
		bodyRecord['current_password'] !== undefined &&
		typeof bodyRecord['current_password'] !== 'string'
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}
	if (
		bodyRecord['username'] === undefined &&
		bodyRecord['nickname'] === undefined
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const [authModule, csrfModule, userModule, updateProfileModule] =
		await Promise.all([
			import('@/features/account/server/auth/requestAuthentication'),
			import('@/features/account/server/auth/accountCsrf'),
			import('@/features/account/server/presentation/user'),
			import('@/features/account/server/useCases/updateProfile'),
		]);

	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}
	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const username =
		typeof bodyRecord['username'] === 'string'
			? bodyRecord['username'].trim()
			: undefined;
	const usernameNormalized =
		username === undefined
			? undefined
			: userModule.normalizeUsername(username);
	const nickname =
		bodyRecord['nickname'] === undefined
			? undefined
			: userModule.normalizeNickname(
					typeof bodyRecord['nickname'] === 'string'
						? bodyRecord['nickname']
						: ''
				);
	if (username !== undefined && !userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidUsername,
			400
		);
	}
	if (nickname !== undefined && !userModule.checkNicknamePolicy(nickname)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidNickname,
			400
		);
	}

	const willChange =
		(usernameNormalized !== undefined &&
			usernameNormalized !== auth.data.user.username_normalized) ||
		(nickname !== undefined && nickname !== auth.data.user.nickname);
	if (willChange) {
		const rateLimitResponse = checkAccountRateLimitRouteResponse(
			request,
			'change-profile',
			auth.data.user.username_normalized
		);
		if (rateLimitResponse !== null) {
			return rateLimitResponse;
		}
	}

	const result = await updateProfileModule.updateProfile({
		account: auth.data,
		...(typeof bodyRecord['current_password'] === 'string'
			? { currentPassword: bodyRecord['current_password'] }
			: {}),
		...(nickname === undefined ? {} : { nickname }),
		request,
		...(username === undefined ? {} : { username }),
		...(usernameNormalized === undefined ? {} : { usernameNormalized }),
	});
	if (result.status === 'locked') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.tooManyRequests,
			429,
			{ retry_after: result.retryAfter },
			{ headers: createRetryAfterHeaders(result.retryAfter) }
		);
	}
	if (result.status === 'error') {
		const httpStatusMap = {
			'credential-changed': 409,
			'invalid-password': 401,
			'invalid-user-status': 403,
			'password-not-set': 409,
			'server-misconfigured': 500,
			unauthorized: 401,
			'username-conflict': 409,
		} as const;
		return createNoStoreErrorResponse(
			result.message,
			httpStatusMap[result.message]
		);
	}

	return createNoStoreJsonResponse({
		csrf_token: result.csrfToken,
		has_password: auth.data.credential.password_set === 1,
		password_must_change: auth.data.credential.password_must_change === 1,
		user: userModule.createAccountUserProfile(result.user),
	});
}
