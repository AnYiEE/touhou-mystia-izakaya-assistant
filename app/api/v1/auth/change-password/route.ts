import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createRetryAfterHeaders,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import { getLogSafeErrorCode } from '@/lib/logging';
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

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const body = await readJsonBody<IAuthChangePasswordBody>(request);
	if (
		typeof body?.current_password !== 'string' ||
		typeof body.new_password !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	let authModule: typeof import('@/lib/account/server/auth');
	let credentialsModule: typeof import('@/actions/account/credentials');
	let passwordModule: typeof import('@/lib/account/server/password');
	let userModule: typeof import('@/lib/account/server/user');
	try {
		[authModule, credentialsModule, passwordModule, userModule] =
			await Promise.all([
				import('@/lib/account/server/auth'),
				import('@/actions/account/credentials'),
				import('@/lib/account/server/password'),
				import('@/lib/account/server/user'),
			]);
	} catch (error) {
		console.warn('Failed to load account password change modules.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	const auth = await authModule.authenticateAccountRequest(request, true);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		authModule.clearAccountSessionCookie(response, request);

		return response;
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

	let session: Awaited<
		ReturnType<typeof authModule.rotateAccountSessionWithCredentialUpdate>
	>;
	try {
		session = await authModule.rotateAccountSessionWithCredentialUpdate(
			auth.data.session,
			request,
			{
				failed_attempts: 0,
				locked_until: null,
				password_hash: await passwordModule.hashPassword(
					body.new_password
				),
				password_must_change: 0,
				updated_at: now,
			}
		);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'invalid-user-status') {
				const response = createNoStoreErrorResponse(
					'invalid-user-status',
					403
				);
				authModule.clearAccountSessionCookie(response, request);

				return response;
			}
			if (
				error.message === 'user-not-found' ||
				error.message === 'session-not-found'
			) {
				const response = createNoStoreErrorResponse(
					'unauthorized',
					401
				);
				authModule.clearAccountSessionCookie(response, request);

				return response;
			}
			if (error.message === 'credential-not-found') {
				const response = createNoStoreErrorResponse(
					'server-misconfigured',
					500
				);
				authModule.clearAccountSessionCookie(response, request);

				return response;
			}
		}

		console.warn('Failed to change account password.', {
			errorCode: getLogSafeErrorCode(error),
		});

		const response = createNoStoreErrorResponse(
			'server-misconfigured',
			500
		);
		authModule.clearAccountSessionCookie(response, request);

		return response;
	}
	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: false,
		user: userModule.createAccountUserProfile(auth.data.user),
	} satisfies IAuthLoginSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
