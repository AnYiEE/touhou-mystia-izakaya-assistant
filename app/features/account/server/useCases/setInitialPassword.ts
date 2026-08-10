import { type NextRequest } from 'next/server';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountUserAuditLogInput,
	writeAccountAuditLogBestEffort,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { createAccountCsrfToken } from '@/features/account/server/auth/accountCsrf';
import { hashPassword } from '@/features/account/server/auth/password';
import { type IAuthenticatedAccount } from '@/features/account/server/auth/requestAuthentication';
import { updateCredentialAndKeepCurrentSession } from '@/features/account/server/persistence/repositories/credentials';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export type TSetInitialPasswordResult =
	| { message: 'invalid-user-status'; status: 'error' }
	| { message: 'password-already-set'; status: 'error' }
	| { message: 'server-misconfigured'; status: 'error' }
	| { message: 'unauthorized'; status: 'error' }
	| { csrfToken: string; status: 'ok' };

export async function setInitialPassword({
	account,
	newPassword,
	request,
}: {
	account: IAuthenticatedAccount;
	newPassword: string;
	request: NextRequest;
}): Promise<TSetInitialPasswordResult> {
	const now = Date.now();
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
						action: ACCOUNT_AUDIT_ACTION_MAP.passwordInitialized,
						metadata: {
							method: 'passkey',
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
		if (Error.isError(error)) {
			if (error.message === 'credential-changed') {
				await writeAccountAuditLogBestEffort(
					createAccountUserAuditLogInput({
						action: ACCOUNT_AUDIT_ACTION_MAP.passwordInitialized,
						metadata: { result: 'password-already-set' },
						request,
						userId: account.user.id,
					})
				);
				return { message: 'password-already-set', status: 'error' };
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

		console.warn('Failed to set initial account password.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return { message: 'server-misconfigured', status: 'error' };
	}

	return {
		csrfToken: createAccountCsrfToken(account.sessionTokenHash),
		status: 'ok',
	};
}
