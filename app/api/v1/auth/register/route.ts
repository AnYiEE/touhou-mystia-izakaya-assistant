import { randomUUID } from 'node:crypto';
import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import {
	type IAuthLoginSuccessResponse,
	type IAuthRegisterBody,
} from '@/lib/account/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const body = await readJsonBody<IAuthRegisterBody>(request);
	if (
		body === null ||
		typeof body.username !== 'string' ||
		typeof body.password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [passwordModule, usersModule, authModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/password'),
			import('@/actions/account/users'),
			import('@/lib/account/server/auth'),
			import('@/lib/account/server/user'),
		]);

	const username = body.username.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}
	if (!passwordModule.checkPasswordPolicy(body.password)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'register',
		usernameNormalized
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const existingUser =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (existingUser !== null) {
		return createNoStoreErrorResponse('username-conflict', 409);
	}

	const now = Date.now();
	const userId = randomUUID();
	const passwordHash = await passwordModule.hashPassword(body.password);
	const session = authModule.createAccountSessionDraft(userId, request, now);
	const user = await usersModule.createUserWithCredentialAndSession(
		{
			created_at: now,
			deleted_at: null,
			id: userId,
			last_login_at: now,
			state_epoch: 0,
			status: USER_STATUS_MAP.active,
			updated_at: now,
			username,
			username_normalized: usernameNormalized,
		},
		{
			failed_attempts: 0,
			locked_until: null,
			password_hash: passwordHash,
			password_must_change: 0,
			updated_at: now,
			user_id: userId,
		},
		session.record
	);
	if (user === null) {
		return createNoStoreErrorResponse('username-conflict', 409);
	}

	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: false,
		user: userModule.createAccountUserProfile(user),
	} satisfies IAuthLoginSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
