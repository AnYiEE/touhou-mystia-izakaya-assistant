import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import {
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
} from '@/lib/account/shared/types';
import { createRetryAfterHeaders } from '@/lib/api/http';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/lib/api/routeResponses';
import { createMainSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVALID_LOGIN_MESSAGE = 'invalid-credentials';
const SSO_AUTHORIZE_PATH = '/sso/authorize';

type TAuthLoginRouteSuccessResponse = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

function checkJsonResponseRequest(request: NextRequest) {
	return (
		request.headers
			.get('accept')
			?.split(',')
			.some(
				(item) => item.trim().split(';', 1)[0] === 'application/json'
			) === true
	);
}

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

function createLoginFailureMetadata(reason: string, username: string) {
	return { reason, username_digest: username };
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
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
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
		accountAuditModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/accountAuditService'),
	]);

	const username = body.username.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const usernameDigest =
		accountAuditModule.createAccountAuditValueDigest(usernameNormalized);
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'login',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const user =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (user === null) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'user-not-found',
					usernameDigest
				),
				request,
				targetId: null,
			})
		);
		return createInvalidLoginResponse();
	}
	if (user.status === USER_STATUS_MAP.disabled) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'user-disabled',
					usernameDigest
				),
				request,
				targetId: user.id,
			})
		);
		return createNoStoreErrorResponse('user-disabled', 403);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'user-deleted',
					usernameDigest
				),
				request,
				targetId: user.id,
			})
		);
		return createNoStoreErrorResponse('user-deleted', 403);
	}

	const credential = await credentialsModule.getCredentialByUserId(user.id);
	if (credential === null) {
		await passwordModule.consumePasswordVerificationCost(body.password);
		console.warn('Account credential is missing during login.');
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'credential-missing',
					usernameDigest
				),
				request,
				targetId: user.id,
			})
		);
		return createInvalidLoginResponse();
	}

	const now = Date.now();
	const lockState = credentialsModule.getCredentialLockState(credential, now);
	if (lockState.status === 'locked') {
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: {
					...createLoginFailureMetadata(
						'credential-locked',
						usernameDigest
					),
					retry_after: lockState.retryAfter,
				},
				request,
				targetId: user.id,
			})
		);
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
			await accountAuditModule.writeAccountAuditLogBestEffort(
				accountAuditModule.createAccountSystemAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.loginFailed,
					metadata: {
						...createLoginFailureMetadata(
							'password-invalid-locked',
							usernameDigest
						),
						retry_after: failureState.retryAfter,
					},
					request,
					targetId: user.id,
				})
			);
			return createCredentialLockedResponse(failureState.retryAfter);
		}

		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'password-invalid',
					usernameDigest
				),
				request,
				targetId: user.id,
			})
		);
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
		userUpdate,
		credential.password_hash,
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.loginSucceeded,
					metadata: {
						must_change_on_next_login:
							credential.password_must_change === 1,
					},
					request,
					userId: user.id,
				}),
				auditNow
			)
	);
	if (session === null) {
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: createLoginFailureMetadata(
					'session-create-failed',
					usernameDigest
				),
				request,
				targetId: user.id,
			})
		);
		return createInvalidLoginResponse();
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const ssoContext = ssoModule.getSsoContextCookie(request);
	const ssoAuthorizeUrl = createMainSiteUrl(SSO_AUTHORIZE_PATH);
	if (ssoContext !== null && !checkJsonResponseRequest(request)) {
		const response = createNoStoreRedirectResponse(ssoAuthorizeUrl);
		authModule.setAccountSessionCookie(response, session.token, request);

		return response;
	}

	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		password_must_change: credential.password_must_change === 1,
		...(ssoContext === null
			? {}
			: { redirect_to: ssoAuthorizeUrl.toString() }),
		user: userModule.createAccountUserProfile(currentUser),
	} satisfies TAuthLoginRouteSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
