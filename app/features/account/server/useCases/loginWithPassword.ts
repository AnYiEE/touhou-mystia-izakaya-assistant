import { type NextRequest } from 'next/server';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountSystemAuditLogInput,
	createAccountUserAuditLogInput,
	writeAccountAuditLogBestEffort,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import {
	consumePasswordVerificationCost,
	verifyPassword,
} from '@/features/account/server/auth/password';
import { createAccountSessionForActiveUser } from '@/features/account/server/auth/sessionLifecycle';
import {
	getCredentialByUserId,
	getCredentialLockState,
	recordFailedCredentialAttempt,
	resetFailedAttemptsForCredential,
} from '@/features/account/server/persistence/repositories/credentials';
import { findUserByUsernameNormalized } from '@/features/account/server/persistence/repositories/users';

import type { TUser } from '@/infrastructure/database/schema';

export type TLoginWithPasswordResult =
	| { message: 'credential-state-stale'; status: 'error' }
	| { message: 'invalid-credentials'; status: 'error' }
	| { message: 'user-deleted'; status: 'error' }
	| { message: 'user-disabled'; status: 'error' }
	| { retryAfter: number; status: 'locked' }
	| {
			passwordMustChange: boolean;
			session: Extract<
				Awaited<ReturnType<typeof createAccountSessionForActiveUser>>,
				{ status: 'ok' }
			>;
			status: 'ok';
			user: TUser;
	  };

function createLoginFailureMetadata(
	reason: string,
	username: string,
	usernameNormalized: string
) {
	return { reason, username, username_normalized: usernameNormalized };
}

async function writeLoginFailure({
	metadata,
	reason,
	request,
	targetId,
	username,
	usernameNormalized,
}: {
	metadata?: Record<string, unknown>;
	reason: string;
	request: NextRequest;
	targetId: string | null;
	username: string;
	usernameNormalized: string;
}) {
	await writeAccountAuditLogBestEffort(
		createAccountSystemAuditLogInput({
			action: ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
			metadata: {
				...createLoginFailureMetadata(
					reason,
					username,
					usernameNormalized
				),
				...metadata,
			},
			request,
			targetId,
		})
	);
}

export async function loginWithPassword({
	password,
	request,
	username,
	usernameNormalized,
}: {
	password: string;
	request: NextRequest;
	username: string;
	usernameNormalized: string;
}): Promise<TLoginWithPasswordResult> {
	const user = await findUserByUsernameNormalized(usernameNormalized);
	if (user === null) {
		await consumePasswordVerificationCost(password);
		await writeLoginFailure({
			reason: 'user-not-found',
			request,
			targetId: null,
			username,
			usernameNormalized,
		});
		return { message: 'invalid-credentials', status: 'error' };
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		await consumePasswordVerificationCost(password);
		await writeLoginFailure({
			reason: 'user-deleted',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'user-deleted', status: 'error' };
	}
	if (user.status === USER_STATUS_MAP.disabled) {
		await consumePasswordVerificationCost(password);
		await writeLoginFailure({
			reason: 'user-disabled',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'user-disabled', status: 'error' };
	}

	const credential = await getCredentialByUserId(user.id);
	if (credential === null) {
		await consumePasswordVerificationCost(password);
		console.warn('Account credential is missing during login.');
		await writeLoginFailure({
			reason: 'credential-missing',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'invalid-credentials', status: 'error' };
	}
	if (credential.password_set !== 1) {
		await consumePasswordVerificationCost(password);
		await writeLoginFailure({
			reason: 'password-not-set',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'invalid-credentials', status: 'error' };
	}

	const now = Date.now();
	const lockState = getCredentialLockState(credential, now);
	if (lockState.status === 'locked') {
		await writeLoginFailure({
			metadata: { retry_after: lockState.retryAfter },
			reason: 'credential-locked',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return lockState;
	}

	if (!(await verifyPassword(credential.password_hash, password))) {
		const failureState = await recordFailedCredentialAttempt({
			expectedPasswordHash: credential.password_hash,
			now,
			userId: user.id,
		});
		if (failureState.status === 'stale') {
			await writeLoginFailure({
				reason: 'credential-state-stale',
				request,
				targetId: user.id,
				username,
				usernameNormalized,
			});
			return { message: 'credential-state-stale', status: 'error' };
		}
		if (failureState.status === 'locked') {
			await writeLoginFailure({
				metadata: { retry_after: failureState.retryAfter },
				reason: 'password-invalid-locked',
				request,
				targetId: user.id,
				username,
				usernameNormalized,
			});
			return failureState;
		}
		await writeLoginFailure({
			reason: 'password-invalid',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'invalid-credentials', status: 'error' };
	}

	const resetState = await resetFailedAttemptsForCredential({
		now,
		passwordHash: credential.password_hash,
		userId: user.id,
	});
	if (resetState.status === 'locked') {
		await writeLoginFailure({
			metadata: { retry_after: resetState.retryAfter },
			reason: 'credential-locked-after-verify',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return resetState;
	}
	if (resetState.status === 'stale') {
		await writeLoginFailure({
			reason: 'credential-state-stale-after-verify',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'credential-state-stale', status: 'error' };
	}

	const currentUser = { ...user, last_login_at: now, updated_at: now };
	const session = await createAccountSessionForActiveUser(
		user.id,
		request,
		{ last_login_at: now, updated_at: now },
		credential.password_hash,
		(trx, auditNow) =>
			writeAccountAuditLogInTransaction(
				trx,
				createAccountUserAuditLogInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.loginSucceeded,
					metadata: {
						method: 'password',
						must_change_on_next_login:
							credential.password_must_change === 1,
						nickname: user.nickname,
						username: user.username,
					},
					request,
					userId: user.id,
				}),
				auditNow
			)
	);
	if (session.status === 'credential-stale') {
		await writeLoginFailure({
			reason: 'credential-state-stale-before-session',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'credential-state-stale', status: 'error' };
	}
	if (session.status === 'user-unavailable') {
		await writeLoginFailure({
			reason: 'session-create-failed',
			request,
			targetId: user.id,
			username,
			usernameNormalized,
		});
		return { message: 'invalid-credentials', status: 'error' };
	}

	return {
		passwordMustChange: credential.password_must_change === 1,
		session,
		status: 'ok',
		user: currentUser,
	};
}
