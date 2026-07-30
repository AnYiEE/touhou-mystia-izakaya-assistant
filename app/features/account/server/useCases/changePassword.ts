import { type NextRequest } from 'next/server';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountUserAuditLogInput,
	writeAccountAuditLogBestEffort,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { createAccountCsrfToken } from '@/features/account/server/auth/accountCsrf';
import {
	hashPassword,
	verifyPassword,
} from '@/features/account/server/auth/password';
import { type IAuthenticatedAccount } from '@/features/account/server/auth/requestAuthentication';
import {
	getCredentialLockState,
	recordFailedCredentialAttempt,
	updateCredentialAndKeepCurrentSession,
} from '@/features/account/server/persistence/repositories/credentials';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export type TChangePasswordResult =
	| { message: 'credential-changed'; status: 'error' }
	| { message: 'invalid-password'; status: 'error' }
	| { message: 'invalid-user-status'; status: 'error' }
	| { message: 'server-misconfigured'; status: 'error' }
	| { message: 'unauthorized'; status: 'error' }
	| { retryAfter: number; status: 'locked' }
	| { csrfToken: string; status: 'ok' };

export async function changePassword({
	account,
	currentPassword,
	newPassword,
	request,
}: {
	account: IAuthenticatedAccount;
	currentPassword: string;
	newPassword: string;
	request: NextRequest;
}): Promise<TChangePasswordResult> {
	const now = Date.now();
	const lockState = getCredentialLockState(account.credential, now);
	if (lockState.status === 'locked') {
		return lockState;
	}

	const isValidPassword = await verifyPassword(
		account.credential.password_hash,
		currentPassword
	);
	if (!isValidPassword) {
		const failureState = await recordFailedCredentialAttempt({
			expectedPasswordHash: account.credential.password_hash,
			now,
			session: {
				id: account.session.id,
				token_hash: account.sessionTokenHash,
			},
			userId: account.user.id,
		});
		if (failureState.status === 'unauthorized') {
			return { message: 'unauthorized', status: 'error' };
		}
		if (failureState.status === 'stale') {
			await writeAccountAuditLogBestEffort(
				createAccountUserAuditLogInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.passwordChanged,
					metadata: { result: 'credential-changed' },
					request,
					userId: account.user.id,
				})
			);
			return { message: 'credential-changed', status: 'error' };
		}
		if (failureState.status === 'locked') {
			return failureState;
		}

		await writeAccountAuditLogBestEffort(
			createAccountUserAuditLogInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.passwordChanged,
				metadata: {
					nickname: account.user.nickname,
					result: 'invalid-current-password',
					username: account.user.username,
				},
				request,
				userId: account.user.id,
			})
		);

		return { message: 'invalid-password', status: 'error' };
	}

	try {
		await updateCredentialAndKeepCurrentSession({
			credential: {
				failed_attempts: 0,
				locked_until: null,
				password_hash: await hashPassword(newPassword),
				password_must_change: 0,
				password_set: 1,
				updated_at: now,
			},
			expectedPasswordHash: account.credential.password_hash,
			lastSeenAt: now,
			sessionId: account.session.id,
			sessionTokenHash: account.sessionTokenHash,
			userId: account.user.id,
			writeAuditLog: (trx, auditNow) =>
				writeAccountAuditLogInTransaction(
					trx,
					createAccountUserAuditLogInput({
						action: ACCOUNT_AUDIT_ACTION_MAP.passwordChanged,
						metadata: {
							nickname: account.user.nickname,
							result: 'ok',
							username: account.user.username,
						},
						request,
						userId: account.user.id,
					}),
					auditNow
				),
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'credential-changed') {
				await writeAccountAuditLogBestEffort(
					createAccountUserAuditLogInput({
						action: ACCOUNT_AUDIT_ACTION_MAP.passwordChanged,
						metadata: { result: 'credential-changed' },
						request,
						userId: account.user.id,
					})
				);
				return { message: 'credential-changed', status: 'error' };
			}
			if (error.message === 'invalid-user-status') {
				return { message: 'invalid-user-status', status: 'error' };
			}
			if (
				error.message === 'user-not-found' ||
				error.message === 'session-not-found'
			) {
				return { message: 'unauthorized', status: 'error' };
			}
			if (error.message === 'credential-not-found') {
				return { message: 'server-misconfigured', status: 'error' };
			}
		}

		console.warn('Failed to change account password.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return { message: 'server-misconfigured', status: 'error' };
	}

	return {
		csrfToken: createAccountCsrfToken(account.sessionTokenHash),
		status: 'ok',
	};
}
