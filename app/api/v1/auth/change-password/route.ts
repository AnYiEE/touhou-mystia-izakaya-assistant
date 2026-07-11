import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	type IAuthChangePasswordBody,
	type IAuthLoginSuccessResponse,
} from '@/lib/account/shared/types';
import { createRetryAfterHeaders } from '@/lib/api/http';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

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
		'change-password'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
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

	const [
		passwordModule,
		credentialsModule,
		authModule,
		userModule,
		accountAuditModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/accountAuditService'),
	]);

	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}
	if (auth.data.credential.password_set !== 1) {
		return createNoStoreErrorResponse('password-not-set', 409);
	}
	if (!passwordModule.checkPasswordPolicy(body.new_password)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
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
			await credentialsModule.recordFailedCredentialAttempt({
				expectedPasswordHash: auth.data.credential.password_hash,
				now,
				session: {
					id: auth.data.session.id,
					token_hash: auth.data.sessionTokenHash,
				},
				userId: auth.data.user.id,
			});
		if (failureState.status === 'unauthorized') {
			return createNoStoreErrorResponse('unauthorized', 401);
		}
		if (failureState.status === 'stale') {
			await accountAuditModule.writeAccountAuditLogBestEffort(
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.passwordChanged,
					metadata: { result: 'credential-changed' },
					request,
					userId: auth.data.user.id,
				})
			);
			return createNoStoreErrorResponse('credential-changed', 409);
		}
		if (failureState.status === 'locked') {
			return createNoStoreErrorResponse(
				'too-many-requests',
				429,
				{ retry_after: failureState.retryAfter },
				{ headers: createRetryAfterHeaders(failureState.retryAfter) }
			);
		}

		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountUserAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
					.passwordChanged,
				metadata: {
					nickname: auth.data.user.nickname,
					result: 'invalid-current-password',
					username: auth.data.user.username,
				},
				request,
				userId: auth.data.user.id,
			})
		);

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
				password_set: 1,
				updated_at: now,
			},
			expectedPasswordHash: auth.data.credential.password_hash,
			lastSeenAt: now,
			sessionId: auth.data.session.id,
			sessionTokenHash: auth.data.sessionTokenHash,
			userId: auth.data.user.id,
			writeAuditLog: (trx, auditNow) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.passwordChanged,
						metadata: {
							nickname: auth.data.user.nickname,
							result: 'ok',
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				),
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'credential-changed') {
				await accountAuditModule.writeAccountAuditLogBestEffort(
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.passwordChanged,
						metadata: { result: 'credential-changed' },
						request,
						userId: auth.data.user.id,
					})
				);
				return createNoStoreErrorResponse('credential-changed', 409);
			}
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
		has_password: true,
		password_must_change: false,
		user: userModule.createAccountUserProfile(auth.data.user),
	} satisfies IAuthLoginSuccessResponse);
}
