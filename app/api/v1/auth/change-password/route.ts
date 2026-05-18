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
import {
	type IAuthChangePasswordBody,
	type IAuthLoginSuccessResponse,
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

	const body = await readJsonBody<IAuthChangePasswordBody>(request);
	if (
		typeof body?.current_password !== 'string' ||
		typeof body.new_password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [authModule, credentialsModule, passwordModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/auth'),
			import('@/actions/account/credentials'),
			import('@/lib/account/server/password'),
			import('@/lib/account/server/user'),
		]);
	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}
	if (!passwordModule.checkPasswordPolicy(body.new_password)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'change-password',
		auth.data.user.username_normalized
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const now = Date.now();
	const lockState = credentialsModule.getCredentialLockState(
		auth.data.credential,
		now
	);
	if (lockState.status === 'locked') {
		return createNoStoreErrorResponse('too-many-requests', 429, {
			retry_after: lockState.retryAfter,
		});
	}

	const isValidPassword = await passwordModule.verifyPassword(
		auth.data.credential.password_hash,
		body.current_password
	);
	if (!isValidPassword) {
		const failureState =
			await credentialsModule.recordFailedCredentialAttempt(
				auth.data.user.id,
				now
			);
		if (failureState.status === 'locked') {
			return createNoStoreErrorResponse('too-many-requests', 429, {
				retry_after: failureState.retryAfter,
			});
		}

		return createNoStoreErrorResponse('invalid-password', 401);
	}

	const session = await authModule.rotateAccountSessionWithCredentialUpdate(
		auth.data.session,
		request,
		{
			failed_attempts: 0,
			locked_until: null,
			password_hash: await passwordModule.hashPassword(body.new_password),
			password_must_change: 0,
			updated_at: now,
		}
	);
	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: false,
		user: userModule.createAccountUserProfile(auth.data.user),
	} satisfies IAuthLoginSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
