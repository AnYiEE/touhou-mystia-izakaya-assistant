import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createRetryAfterHeaders,
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

const INVALID_LOGIN_MESSAGE = 'invalid-credentials';

function createInvalidLoginResponse() {
	return createNoStoreErrorResponse(INVALID_LOGIN_MESSAGE, 401);
}

function createCredentialLockedResponse(retryAfter: number) {
	return createNoStoreErrorResponse(
		'too-many-requests',
		429,
		{ retry_after: retryAfter },
		{ headers: createRetryAfterHeaders(retryAfter) }
	);
}

function createCredentialStateStaleResponse() {
	return createNoStoreErrorResponse('credential-state-stale', 409);
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

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const body = await readJsonBody<IAuthLoginBody>(request);
	if (
		body === null ||
		typeof body.username !== 'string' ||
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

	const username = body.username.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
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
		await passwordModule.consumePasswordVerificationCost(body.password);
		return createInvalidLoginResponse();
	}
	if (user.status === USER_STATUS_MAP.disabled) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		return createNoStoreErrorResponse('account-disabled', 403);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		return createNoStoreErrorResponse('account-deleted', 403);
	}

	const credential = await credentialsModule.getCredentialByUserId(user.id);
	if (credential === null) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		console.warn('Account credential is missing during login.');
		return createInvalidLoginResponse();
	}

	const now = Date.now();
	const lockState = credentialsModule.getCredentialLockState(credential, now);
	if (lockState.status === 'locked') {
		return createCredentialLockedResponse(lockState.retryAfter);
	}

	const isValidPassword = await passwordModule.verifyPassword(
		credential.password_hash,
		body.password
	);
	if (!isValidPassword) {
		const failureState =
			await credentialsModule.recordFailedCredentialAttempt(user.id, now);
		if (failureState.status === 'locked') {
			return createCredentialLockedResponse(failureState.retryAfter);
		}

		return createInvalidLoginResponse();
	}

	const resetState = await credentialsModule.resetFailedAttemptsForCredential(
		{ now, passwordHash: credential.password_hash, userId: user.id }
	);
	if (resetState.status === 'locked') {
		return createCredentialLockedResponse(resetState.retryAfter);
	}
	if (resetState.status === 'stale') {
		return createCredentialStateStaleResponse();
	}

	const userUpdate = { last_login_at: now, updated_at: now };

	const currentUser = { ...user, last_login_at: now, updated_at: now };
	const session = await authModule.createAccountSessionForActiveUser(
		user.id,
		request,
		userUpdate
	);
	if (session === null) {
		return createInvalidLoginResponse();
	}
	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: credential.password_must_change === 1,
		user: userModule.createAccountUserProfile(currentUser),
	} satisfies IAuthLoginSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
