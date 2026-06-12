import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
	createRetryAfterHeaders,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { getLogSafeErrorCode } from '@/lib/logging';
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

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IAuthChangePasswordBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		typeof body?.current_password !== 'string' ||
		typeof body.new_password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [passwordModule, credentialsModule, authModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/password'),
			import('@/lib/account/server/repositories/credentials'),
			import('@/lib/account/server/auth'),
			import('@/lib/account/server/user'),
		]);

	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
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
		return createNoStoreErrorResponse(
			'too-many-requests',
			429,
			{ retry_after: lockState.retryAfter },
			{ headers: createRetryAfterHeaders(lockState.retryAfter) }
		);
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
			return createNoStoreErrorResponse(
				'too-many-requests',
				429,
				{ retry_after: failureState.retryAfter },
				{ headers: createRetryAfterHeaders(failureState.retryAfter) }
			);
		}

		return createNoStoreErrorResponse('invalid-password', 401);
	}

	try {
		await credentialsModule.updateCredentialAndKeepCurrentSession({
			credential: {
				failed_attempts: 0,
				locked_until: null,
				password_hash: await passwordModule.hashPassword(
					body.new_password
				),
				password_must_change: 0,
				updated_at: now,
			},
			lastSeenAt: now,
			sessionId: auth.data.session.id,
			userId: auth.data.user.id,
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse('invalid-user-status', 403);
			}
			if (
				error.message === 'user-not-found' ||
				error.message === 'session-not-found'
			) {
				return createNoStoreErrorResponse('unauthorized', 401);
			}
			if (error.message === 'credential-not-found') {
				return createNoStoreErrorResponse('server-misconfigured', 500);
			}
		}

		console.warn('Failed to change account password.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}

	return createNoStoreJsonResponse({
		csrf_token: authModule.createAccountCsrfToken(
			auth.data.sessionTokenHash
		),
		password_must_change: false,
		user: userModule.createAccountUserProfile(auth.data.user),
	} satisfies IAuthLoginSuccessResponse);
}
