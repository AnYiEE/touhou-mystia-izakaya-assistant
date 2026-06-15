'use server';

import { cookies } from 'next/headers';

import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	authenticateAdminSessionToken,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkAdminCsrfGuard,
	checkAdminFeatureGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';
import { checkPasswordPolicy } from '@/lib/account/server/password';
import {
	ACCOUNT_COOKIE_NAME_MAP,
	USER_STATUS_MAP,
} from '@/lib/account/shared/constants';
import {
	type IAdminResetPasswordBody,
	type IAdminUserDetailData,
} from '@/lib/account/shared/types';

export type TAdminUserDetailActionResult<TData = Record<string, unknown>> =
	| { data: TData; detail: IAdminUserDetailData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminUserDetailActionScope =
	| 'admin-clear-user-data'
	| 'admin-delete-user-sessions'
	| 'admin-disable-user'
	| 'admin-enable-user'
	| 'admin-reset-password'
	| 'admin-restore-user'
	| 'admin-user-detail';

function createActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAdminUserDetailActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

async function readAdminSessionToken() {
	const cookieStore = await cookies();

	return cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
}

async function checkAdminUserActionRequest(
	scope: TAdminUserDetailActionScope,
	csrfToken?: string,
	parts: ReadonlyArray<{ name: string; value: string }> = []
): Promise<
	| { status: 'ok' }
	| Extract<TAdminUserDetailActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return createGuardActionError(adminFeatureResult);
	}

	const request = await createCurrentRequest('/admin/users/action');
	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimitGuard(request, scope, '', {
		parts,
	});
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const adminSessionToken = await readAdminSessionToken();
	const adminAuthResult = authenticateAdminSessionToken(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return createGuardActionError(adminAuthResult);
	}

	if (csrfToken !== undefined) {
		if (typeof csrfToken !== 'string') {
			return createActionError('forbidden', 403);
		}

		const csrfResult = checkAdminCsrfGuard(
			csrfToken,
			adminAuthResult.data.token
		);
		if (csrfResult.status === 'error') {
			return createGuardActionError(csrfResult);
		}
	}

	return { status: 'ok' };
}

async function readAdminUserDetail(id: string) {
	const [usersModule, sessionsModule, userStateModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/repositories/users'),
			import('@/lib/account/server/repositories/sessions'),
			import('@/lib/account/server/repositories/userState'),
			import('@/lib/account/server/user'),
		]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return null;
	}

	const [sessions, namespaces] = await Promise.all([
		sessionsModule.listSessionsByUserId(user.id),
		userStateModule.listUserNamespaces(user.id),
	]);

	return {
		namespaces,
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	} satisfies IAdminUserDetailData;
}

async function createSuccessResult<TData>(
	id: string,
	data: TData
): Promise<TAdminUserDetailActionResult<TData>> {
	const detail = await readAdminUserDetail(id);
	if (detail === null) {
		return createActionError('target-user-not-found', 404);
	}

	return { data, detail, status: 'ok' };
}

export async function refreshAdminUserDetailAction(
	id: string
): Promise<TAdminUserDetailActionResult> {
	const guard = await checkAdminUserActionRequest(
		'admin-user-detail',
		undefined,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const detail = await readAdminUserDetail(id);
	if (detail === null) {
		return createActionError('target-user-not-found', 404);
	}

	return { data: {}, detail, status: 'ok' };
}

export async function resetAdminUserPasswordAction(
	id: string,
	body: IAdminResetPasswordBody,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ message: 'password-reset' }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-reset-password',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	if (typeof body.password !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const [passwordModule, usersModule, credentialsModule] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
	]);
	if (!checkPasswordPolicy(body.password)) {
		return createActionError('invalid-password-rule', 400);
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createActionError('target-user-not-found', 404);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createActionError('invalid-user-status', 403);
	}

	try {
		await credentialsModule.updateCredentialAndDeleteSessions(id, {
			failed_attempts: 0,
			locked_until: null,
			password_hash: await passwordModule.hashPassword(body.password),
			password_must_change: 1,
			updated_at: Date.now(),
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return createActionError('target-user-not-found', 404);
			}
			if (error.message === 'invalid-user-status') {
				return createActionError('invalid-user-status', 403);
			}
			if (error.message === 'credential-not-found') {
				return createActionError('credential-not-found', 500);
			}
		}

		throw error;
	}

	return createSuccessResult(id, { message: 'password-reset' });
}

export async function disableAdminUserAction(
	id: string,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ message: 'user-disabled' }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-disable-user',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const usersModule = await import('@/lib/account/server/repositories/users');
	const isUpdated =
		await usersModule.disableUserAndDeleteSessionsWithSsoCallbacks(id);
	if (isUpdated) {
		return createSuccessResult(id, { message: 'user-disabled' });
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createActionError('target-user-not-found', 404);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createActionError('user-deleted', 403);
	}
	if (user.status !== USER_STATUS_MAP.active) {
		return createActionError('update-not-applied', 409);
	}

	return createActionError('update-not-applied', 409);
}

export async function enableAdminUserAction(
	id: string,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ message: 'user-enabled' }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-enable-user',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const usersModule = await import('@/lib/account/server/repositories/users');
	const isUpdated = await usersModule.setUserStatusIfCurrentStatus(
		id,
		USER_STATUS_MAP.disabled,
		USER_STATUS_MAP.active
	);
	if (isUpdated) {
		return createSuccessResult(id, { message: 'user-enabled' });
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createActionError('target-user-not-found', 404);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createActionError('user-deleted', 403);
	}
	if (user.status !== USER_STATUS_MAP.disabled) {
		return createActionError('update-not-applied', 409);
	}

	return createActionError('update-not-applied', 409);
}

export async function restoreAdminUserAction(
	id: string,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ message: 'user-restored' }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-restore-user',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const usersModule = await import('@/lib/account/server/repositories/users');
	const isUpdated = await usersModule.setUserStatusIfCurrentStatus(
		id,
		USER_STATUS_MAP.deleted,
		USER_STATUS_MAP.disabled,
		true
	);
	if (isUpdated) {
		return createSuccessResult(id, { message: 'user-restored' });
	}

	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createActionError('target-user-not-found', 404);
	}
	if (user.status !== USER_STATUS_MAP.deleted) {
		return createActionError('update-not-applied', 409);
	}

	return createActionError('update-not-applied', 409);
}

export async function deleteAdminUserSessionsAction(
	id: string,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ message: 'sessions-deleted' }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-delete-user-sessions',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const [usersModule, sessionsModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/sessions'),
	]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createActionError('target-user-not-found', 404);
	}

	await sessionsModule.deleteSessionsByUserId(id);

	return createSuccessResult(id, { message: 'sessions-deleted' });
}

export async function clearAdminUserDataAction(
	id: string,
	csrfToken: string
): Promise<TAdminUserDetailActionResult<{ state_epoch: number }>> {
	const guard = await checkAdminUserActionRequest(
		'admin-clear-user-data',
		csrfToken,
		[{ name: 'target-user', value: id }]
	);
	if (guard.status === 'error') {
		return guard;
	}

	const userStateModule =
		await import('@/lib/account/server/repositories/userState');

	try {
		const stateEpoch =
			await userStateModule.clearUserDataAndDeleteSessionsAndIncrementStateEpoch(
				id
			);

		return await createSuccessResult(id, { state_epoch: stateEpoch });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return createActionError('target-user-not-found', 404);
			}
			if (error.message === 'invalid-user-status') {
				return createActionError('invalid-user-status', 403);
			}
			if (error.message === 'update-not-applied') {
				return createActionError('update-not-applied', 409);
			}
		}

		throw error;
	}
}
