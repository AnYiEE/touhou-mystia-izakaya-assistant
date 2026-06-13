'use server';

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

import {
	type TAccountActionResult,
	createAccountActionError as createActionError,
	stringifyActionJsonBody,
} from '@/lib/account/actions/utils';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkSameOrigin,
} from '@/lib/account/server/guards';
import {
	ACCOUNT_COOKIE_NAME_MAP,
	USER_STATUS_MAP,
} from '@/lib/account/shared/constants';
import { MAX_ACCOUNT_SMALL_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	type IAccountExportData,
	type IAuthChangePasswordBody,
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
	type IAuthRegisterBody,
	type TAccountMeResponse,
} from '@/lib/account/shared/types';
import { getLogSafeErrorCode } from '@/lib/logging';

const INVALID_LOGIN_MESSAGE = 'invalid-credentials';
const SSO_AUTHORIZE_PATH = '/sso/authorize';

export type TAuthLoginSuccessActionData = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

export type TAccountAuthActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

function createCredentialLockedActionError(retryAfter: number) {
	return createActionError('too-many-requests', 429, {
		retry_after: retryAfter,
	});
}

function createAnonymousAccountMeData(): TAccountMeResponse {
	return {
		csrf_token: null,
		featureEnabled: true,
		isLoggedIn: false,
		password_must_change: false,
		state_epoch: null,
		syncMeta: null,
		user: null,
	};
}

function checkActionBodySize(body: unknown) {
	const bodyResult = stringifyActionJsonBody(
		body,
		MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
	);

	return bodyResult.status === 'ok' ? { status: 'ok' as const } : bodyResult;
}

async function checkAccountAuthActionRequest(pathname: string) {
	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const request = await createCurrentRequest(pathname);
	const sameOriginResult = checkSameOrigin(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	return { request, status: 'ok' as const };
}

async function authenticateAccountDataActionRequest(
	pathname: string,
	scope: string,
	options: { csrfToken: unknown; requireCsrf: true } | { requireCsrf: false }
) {
	const base = await checkAccountAuthActionRequest(pathname);
	if (base.status === 'error') {
		return base;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(base.request);
	if (auth.status === 'error') {
		return createActionError(auth.message, auth.httpStatus);
	}

	const rateLimitResult = checkAccountRateLimit(base.request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	if (
		options.requireCsrf &&
		(typeof options.csrfToken !== 'string' ||
			!authModule.verifyAccountCsrfToken(
				options.csrfToken,
				auth.data.sessionTokenHash
			))
	) {
		return createActionError('forbidden', 403);
	}

	return {
		authModule,
		data: auth.data,
		request: base.request,
		status: 'ok' as const,
	};
}

async function setAccountSessionCookieAsync(
	token: string,
	cookieOptions: ReturnType<
		(typeof import('@/lib/account/server/auth'))['getAccountSessionCookieOptions']
	>
) {
	const cookieStore = await cookies();
	cookieStore.set(ACCOUNT_COOKIE_NAME_MAP.session, token, cookieOptions);
}

async function clearAccountSessionCookieAsync(
	cookieOptions: ReturnType<
		(typeof import('@/lib/account/server/auth'))['getAccountSessionCookieOptions']
	>
) {
	const cookieStore = await cookies();
	cookieStore.set(ACCOUNT_COOKIE_NAME_MAP.session, '', {
		...cookieOptions,
		maxAge: 0,
	});
}

function createAuthSuccessData(
	data: IAuthLoginSuccessResponse,
	redirectTo?: string
): TAuthLoginSuccessActionData {
	return redirectTo === undefined
		? data
		: { ...data, redirect_to: redirectTo };
}

export async function loginAccountAction(
	body: unknown
): Promise<TAccountAuthActionResult<TAuthLoginSuccessActionData>> {
	const base = await checkAccountAuthActionRequest('/auth/login/action');
	if (base.status === 'error') {
		return base;
	}

	const bodySizeResult = checkActionBodySize(body);
	if (bodySizeResult.status === 'payload-too-large') {
		return createActionError('payload-too-large', 413);
	}
	if (bodySizeResult.status === 'invalid') {
		return createActionError('invalid-object-structure', 400);
	}
	if (body === null || typeof body !== 'object') {
		return createActionError('invalid-object-structure', 400);
	}
	const candidate = body as Partial<IAuthLoginBody>;
	if (
		typeof candidate.username !== 'string' ||
		typeof candidate.password !== 'string'
	) {
		return createActionError('invalid-object-structure', 400);
	}

	const [
		passwordModule,
		usersModule,
		credentialsModule,
		authModule,
		userModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
	]);

	const username = candidate.username.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createActionError('invalid-username', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResult = checkAccountRateLimit(
		base.request,
		'login',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const user =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (user === null) {
		await passwordModule.consumePasswordVerificationCost(
			candidate.password
		);
		return createActionError(INVALID_LOGIN_MESSAGE, 401);
	}
	if (user.status === USER_STATUS_MAP.disabled) {
		await passwordModule.consumePasswordVerificationCost(
			candidate.password
		);
		return createActionError('user-disabled', 403);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		await passwordModule.consumePasswordVerificationCost(
			candidate.password
		);
		return createActionError('user-deleted', 403);
	}

	const credential = await credentialsModule.getCredentialByUserId(user.id);
	if (credential === null) {
		await passwordModule.consumePasswordVerificationCost(
			candidate.password
		);
		console.warn('Account credential is missing during login.');
		return createActionError(INVALID_LOGIN_MESSAGE, 401);
	}

	const now = Date.now();
	const lockState = credentialsModule.getCredentialLockState(credential, now);
	if (lockState.status === 'locked') {
		return createCredentialLockedActionError(lockState.retryAfter);
	}

	const isValidPassword = await passwordModule.verifyPassword(
		credential.password_hash,
		candidate.password
	);
	if (!isValidPassword) {
		const failureState =
			await credentialsModule.recordFailedCredentialAttempt(user.id, now);
		if (failureState.status === 'locked') {
			return createCredentialLockedActionError(failureState.retryAfter);
		}

		return createActionError(INVALID_LOGIN_MESSAGE, 401);
	}

	const resetState = await credentialsModule.resetFailedAttemptsForCredential(
		{ now, passwordHash: credential.password_hash, userId: user.id }
	);
	if (resetState.status === 'locked') {
		return createCredentialLockedActionError(resetState.retryAfter);
	}
	if (resetState.status === 'stale') {
		return createActionError('credential-state-stale', 409);
	}

	const currentUser = { ...user, last_login_at: now, updated_at: now };
	const session = await authModule.createAccountSessionForActiveUser(
		user.id,
		base.request,
		{ last_login_at: now, updated_at: now },
		credential.password_hash
	);
	if (session === null) {
		return createActionError(INVALID_LOGIN_MESSAGE, 401);
	}

	await setAccountSessionCookieAsync(session.token, session.cookieOptions);

	const ssoModule = await import('@/lib/account/server/sso');
	const ssoContext = ssoModule.getSsoContextCookie(base.request);
	return {
		data: createAuthSuccessData(
			{
				csrf_token: session.csrfToken,
				password_must_change: credential.password_must_change === 1,
				user: userModule.createAccountUserProfile(currentUser),
			},
			ssoContext === null ? undefined : SSO_AUTHORIZE_PATH
		),
		status: 'ok',
	};
}

export async function fetchAccountMeAction(): Promise<
	TAccountAuthActionResult<TAccountMeResponse>
> {
	const base = await checkAccountAuthActionRequest('/account/me/action');
	if (base.status === 'error') {
		return base;
	}

	const [authModule, userModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/repositories/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(
		base.request,
		true
	);
	if (auth.status === 'error') {
		if (auth.message === 'unauthorized') {
			return { data: createAnonymousAccountMeData(), status: 'ok' };
		}

		return createActionError(auth.message, auth.httpStatus);
	}

	const stateSnapshot = await userStateModule.getUserStateSnapshot(
		auth.data.user.id
	);
	if (stateSnapshot === null) {
		return createActionError('unauthorized', 401);
	}

	const revisions = stateSnapshot.state.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		data: {
			csrf_token: authModule.createAccountCsrfToken(
				auth.data.sessionTokenHash
			),
			featureEnabled: true,
			isLoggedIn: true,
			password_must_change:
				auth.data.credential.password_must_change === 1,
			state_epoch: stateSnapshot.user.state_epoch,
			syncMeta: {
				lastAppliedRemoteHash: {},
				revisions,
				state_epoch: stateSnapshot.user.state_epoch,
			},
			user: userModule.createAccountUserProfile(stateSnapshot.user),
		},
		status: 'ok',
	};
}

export async function registerAccountAction(
	body: unknown
): Promise<TAccountAuthActionResult<TAuthLoginSuccessActionData>> {
	const base = await checkAccountAuthActionRequest('/auth/register/action');
	if (base.status === 'error') {
		return base;
	}

	const bodySizeResult = checkActionBodySize(body);
	if (bodySizeResult.status === 'payload-too-large') {
		return createActionError('payload-too-large', 413);
	}
	if (bodySizeResult.status === 'invalid') {
		return createActionError('invalid-object-structure', 400);
	}
	if (body === null || typeof body !== 'object') {
		return createActionError('invalid-object-structure', 400);
	}
	const candidate = body as Partial<IAuthRegisterBody>;
	if (
		typeof candidate.username !== 'string' ||
		typeof candidate.password !== 'string'
	) {
		return createActionError('invalid-object-structure', 400);
	}

	const [passwordModule, usersModule, authModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/password'),
			import('@/lib/account/server/repositories/users'),
			import('@/lib/account/server/auth'),
			import('@/lib/account/server/user'),
		]);

	const username = candidate.username.trim();
	if (!userModule.checkNewUsernamePolicy(username)) {
		return createActionError('invalid-username', 400);
	}
	if (!passwordModule.checkPasswordPolicy(candidate.password)) {
		return createActionError('invalid-password-rule', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResult = checkAccountRateLimit(
		base.request,
		'register',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const existingUser =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (existingUser !== null) {
		return createActionError('username-conflict', 409);
	}

	const now = Date.now();
	const userId = randomUUID();
	let session: ReturnType<typeof authModule.createAccountSessionDraft>;
	let user: Awaited<
		ReturnType<typeof usersModule.createUserWithCredentialAndSession>
	>;

	try {
		const passwordHash = await passwordModule.hashPassword(
			candidate.password
		);
		session = authModule.createAccountSessionDraft(
			userId,
			base.request,
			now
		);
		user = await usersModule.createUserWithCredentialAndSession(
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
	} catch (error) {
		console.warn('Failed to create account registration records.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createActionError('server-misconfigured', 500);
	}
	if (user === null) {
		return createActionError('username-conflict', 409);
	}

	await setAccountSessionCookieAsync(session.token, session.cookieOptions);

	const ssoModule = await import('@/lib/account/server/sso');
	const ssoContext = ssoModule.getSsoContextCookie(base.request);
	return {
		data: createAuthSuccessData(
			{
				csrf_token: session.csrfToken,
				password_must_change: false,
				user: userModule.createAccountUserProfile(user),
			},
			ssoContext === null ? undefined : SSO_AUTHORIZE_PATH
		),
		status: 'ok',
	};
}

export async function changeAccountPasswordAction(
	body: unknown,
	csrfToken: unknown
): Promise<TAccountAuthActionResult<IAuthLoginSuccessResponse>> {
	const base = await checkAccountAuthActionRequest(
		'/auth/change-password/action'
	);
	if (base.status === 'error') {
		return base;
	}

	const bodySizeResult = checkActionBodySize(body);
	if (bodySizeResult.status === 'payload-too-large') {
		return createActionError('payload-too-large', 413);
	}
	if (bodySizeResult.status === 'invalid') {
		return createActionError('invalid-object-structure', 400);
	}
	if (body === null || typeof body !== 'object') {
		return createActionError('invalid-object-structure', 400);
	}
	const candidate = body as Partial<IAuthChangePasswordBody>;
	if (
		typeof candidate.current_password !== 'string' ||
		typeof candidate.new_password !== 'string'
	) {
		return createActionError('invalid-object-structure', 400);
	}
	if (typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	const [passwordModule, credentialsModule, authModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/password'),
			import('@/lib/account/server/repositories/credentials'),
			import('@/lib/account/server/auth'),
			import('@/lib/account/server/user'),
		]);

	const auth = await authModule.authenticateAccountRequest(
		base.request,
		true
	);
	if (auth.status === 'error') {
		return createActionError(auth.message, auth.httpStatus);
	}
	if (
		!authModule.verifyAccountCsrfToken(
			csrfToken,
			auth.data.sessionTokenHash
		)
	) {
		return createActionError('forbidden', 403);
	}
	if (!passwordModule.checkPasswordPolicy(candidate.new_password)) {
		return createActionError('invalid-password-rule', 400);
	}

	const rateLimitResult = checkAccountRateLimit(
		base.request,
		'change-password',
		auth.data.user.username_normalized
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const now = Date.now();
	const lockState = credentialsModule.getCredentialLockState(
		auth.data.credential,
		now
	);
	if (lockState.status === 'locked') {
		return createCredentialLockedActionError(lockState.retryAfter);
	}

	const isValidPassword = await passwordModule.verifyPassword(
		auth.data.credential.password_hash,
		candidate.current_password
	);
	if (!isValidPassword) {
		const failureState =
			await credentialsModule.recordFailedCredentialAttempt(
				auth.data.user.id,
				now
			);
		if (failureState.status === 'locked') {
			return createCredentialLockedActionError(failureState.retryAfter);
		}

		return createActionError('invalid-password', 401);
	}

	try {
		await credentialsModule.updateCredentialAndKeepCurrentSession({
			credential: {
				failed_attempts: 0,
				locked_until: null,
				password_hash: await passwordModule.hashPassword(
					candidate.new_password
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
				return createActionError('invalid-user-status', 403);
			}
			if (
				error.message === 'user-not-found' ||
				error.message === 'session-not-found'
			) {
				return createActionError('unauthorized', 401);
			}
			if (error.message === 'credential-not-found') {
				return createActionError('server-misconfigured', 500);
			}
		}

		console.warn('Failed to change account password.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createActionError('server-misconfigured', 500);
	}

	return {
		data: {
			csrf_token: authModule.createAccountCsrfToken(
				auth.data.sessionTokenHash
			),
			password_must_change: false,
			user: userModule.createAccountUserProfile(auth.data.user),
		},
		status: 'ok',
	};
}

export async function logoutAccountAction(
	csrfToken: unknown
): Promise<TAccountAuthActionResult<{ message: 'logged-out' }>> {
	const base = await checkAccountAuthActionRequest('/auth/logout/action');
	if (base.status === 'error') {
		return base;
	}

	if (typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(
		base.request,
		true
	);
	if (auth.status === 'error') {
		return createActionError(auth.message, auth.httpStatus);
	}

	const rateLimitResult = checkAccountRateLimit(base.request, 'auth-logout');
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	if (
		!authModule.verifyAccountCsrfToken(
			csrfToken,
			auth.data.sessionTokenHash
		)
	) {
		return createActionError('forbidden', 403);
	}

	const sessionsModule =
		await import('@/lib/account/server/repositories/sessions');
	await sessionsModule.deleteSessionById(auth.data.session.id);
	await clearAccountSessionCookieAsync(
		authModule.getAccountSessionCookieOptions(base.request)
	);

	return { data: { message: 'logged-out' }, status: 'ok' };
}

export async function logoutAllAccountAction(
	csrfToken: unknown
): Promise<TAccountAuthActionResult<{ message: 'logged-out-all' }>> {
	const requestStartedAt = Date.now();
	const base = await checkAccountAuthActionRequest('/auth/logout-all/action');
	if (base.status === 'error') {
		return base;
	}

	if (typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(
		base.request,
		true
	);
	if (auth.status === 'error') {
		return createActionError(auth.message, auth.httpStatus);
	}

	const rateLimitResult = checkAccountRateLimit(
		base.request,
		'auth-logout-all'
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	if (
		!authModule.verifyAccountCsrfToken(
			csrfToken,
			auth.data.sessionTokenHash
		)
	) {
		return createActionError('forbidden', 403);
	}

	const sessionsModule =
		await import('@/lib/account/server/repositories/sessions');
	await sessionsModule.deleteSessionsByUserId(auth.data.user.id, {
		createdBefore: requestStartedAt,
	});
	await clearAccountSessionCookieAsync(
		authModule.getAccountSessionCookieOptions(base.request)
	);

	return { data: { message: 'logged-out-all' }, status: 'ok' };
}

export async function exportAccountDataAction(): Promise<
	TAccountAuthActionResult<IAccountExportData>
> {
	const auth = await authenticateAccountDataActionRequest(
		'/account/export/action',
		'account-export',
		{ requireCsrf: false }
	);
	if (auth.status === 'error') {
		return auth;
	}

	const [userStateModule, userModule] = await Promise.all([
		import('@/lib/account/server/repositories/userState'),
		import('@/lib/account/server/user'),
	]);
	const snapshot = await userStateModule.getUserStateSnapshot(
		auth.data.user.id
	);
	if (snapshot === null) {
		return createActionError('unauthorized', 401);
	}

	return {
		data: {
			state: snapshot.state,
			state_epoch: snapshot.user.state_epoch,
			user: userModule.createAccountUserProfile(snapshot.user),
		},
		status: 'ok',
	};
}

export async function deleteAccountDataAction(
	csrfToken: unknown
): Promise<TAccountAuthActionResult<{ state_epoch: number }>> {
	const auth = await authenticateAccountDataActionRequest(
		'/account/delete-data/action',
		'account-delete-data',
		{ csrfToken, requireCsrf: true }
	);
	if (auth.status === 'error') {
		return auth;
	}

	const userStateModule =
		await import('@/lib/account/server/repositories/userState');
	try {
		return {
			data: {
				state_epoch:
					await userStateModule.clearUserStateAndIncrementStateEpoch(
						auth.data.user.id
					),
			},
			status: 'ok',
		};
	} catch (error) {
		if (error instanceof Error && error.message === 'user-not-found') {
			return createActionError('unauthorized', 401);
		}

		throw error;
	}
}

export async function deleteAccountAction(
	csrfToken: unknown
): Promise<TAccountAuthActionResult<{ message: 'user-deleted' }>> {
	const auth = await authenticateAccountDataActionRequest(
		'/account/delete/action',
		'account-delete',
		{ csrfToken, requireCsrf: true }
	);
	if (auth.status === 'error') {
		return auth;
	}

	const usersModule = await import('@/lib/account/server/repositories/users');
	await usersModule.setUserStatusAndDeleteSessions(
		auth.data.user.id,
		USER_STATUS_MAP.deleted
	);

	await clearAccountSessionCookieAsync(
		auth.authModule.getAccountSessionCookieOptions(auth.request)
	);

	return { data: { message: 'user-deleted' }, status: 'ok' };
}
