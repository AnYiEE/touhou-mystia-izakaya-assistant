import { type NextRequest } from 'next/server';

import {
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
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
} from '@/lib/account/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOGIN_FAILED_ATTEMPT_LIMIT = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const INVALID_LOGIN_MESSAGE = 'invalid-credentials';

function createInvalidLoginResponse() {
	return createNoStoreErrorResponse(INVALID_LOGIN_MESSAGE, 401);
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const body = await readJsonBody<IAuthLoginBody>(request);
	if (
		typeof body?.username !== 'string' ||
		typeof body.password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [
		passwordModule,
		usersModule,
		credentialsModule,
		authModule,
		userModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/actions/account/users'),
		import('@/actions/account/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
	]);

	if (!userModule.checkUsernamePolicy(body.username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(body.username);
	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'login',
		usernameNormalized
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const user =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (user === null) {
		return createInvalidLoginResponse();
	}
	if (user.status === USER_STATUS_MAP.disabled) {
		return createInvalidLoginResponse();
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createInvalidLoginResponse();
	}

	const credential = await credentialsModule.getCredentialByUserId(user.id);
	if (credential === null) {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}

	const now = Date.now();
	if (credential.locked_until !== null && credential.locked_until > now) {
		return createNoStoreErrorResponse('too-many-requests', 429, {
			retry_after: Math.ceil((credential.locked_until - now) / 1000),
		});
	}

	const isValidPassword = await passwordModule.verifyPassword(
		credential.password_hash,
		body.password
	);
	if (!isValidPassword) {
		const failedAttempts = await credentialsModule.incrementFailedAttempts(
			user.id
		);

		if (failedAttempts >= LOGIN_FAILED_ATTEMPT_LIMIT) {
			await credentialsModule.setLockedUntil(
				user.id,
				now + LOGIN_LOCK_MS
			);
			return createNoStoreErrorResponse('too-many-requests', 429, {
				retry_after: Math.ceil(LOGIN_LOCK_MS / 1000),
			});
		}

		return createInvalidLoginResponse();
	}

	await Promise.all([
		credentialsModule.resetFailedAttempts(user.id),
		usersModule.updateUser(user.id, {
			last_login_at: now,
			updated_at: now,
		}),
	]);

	const currentUser = { ...user, last_login_at: now, updated_at: now };
	const session = await authModule.createAccountSession(user.id, request);
	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: credential.password_must_change === 1,
		user: userModule.createAccountUserProfile(currentUser),
	} satisfies IAuthLoginSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
