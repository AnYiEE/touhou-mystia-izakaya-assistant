import { type NextRequest } from 'next/server';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAdminAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { hashPassword } from '@/features/account/server/auth/password';
import { updateCredentialAndDeleteSessionsWithAudit } from '@/features/account/server/persistence/repositories/credentials';
import { findUserById } from '@/features/account/server/persistence/repositories/users';
import { countCredentialsByUserId } from '@/features/account/webauthn/server/persistence/credentials';

export type TResetUserPasswordResult =
	| { message: 'invalid-user-status'; status: 'error' }
	| { message: 'server-misconfigured'; status: 'error' }
	| { message: 'target-user-not-found'; status: 'error' }
	| { status: 'ok' };

export async function resetUserPassword({
	actorId,
	password,
	request,
	userId,
}: {
	actorId: string;
	password: string;
	request: NextRequest;
	userId: string;
}): Promise<TResetUserPasswordResult> {
	const user = await findUserById(userId);
	if (user === null) {
		return { message: 'target-user-not-found', status: 'error' };
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return { message: 'invalid-user-status', status: 'error' };
	}

	const revokedPasskeys = await countCredentialsByUserId(userId);
	try {
		const now = Date.now();
		await updateCredentialAndDeleteSessionsWithAudit(
			userId,
			{
				failed_attempts: 0,
				locked_until: null,
				password_hash: await hashPassword(password),
				password_must_change: 1,
				password_set: 1,
				updated_at: now,
			},
			(trx, auditNow) =>
				writeAccountAuditLogInTransaction(
					trx,
					createAccountAdminAuditLogInput({
						action: ACCOUNT_AUDIT_ACTION_MAP.adminResetPassword,
						adminId: actorId,
						metadata: {
							must_change_on_next_login: true,
							revoked_passkeys: revokedPasskeys,
							target_nickname: user.nickname,
							target_user_id: userId,
							target_username: user.username,
						},
						request,
						targetId: userId,
						targetType: 'user',
					}),
					auditNow
				)
		);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return { message: 'target-user-not-found', status: 'error' };
			}
			if (error.message === 'invalid-user-status') {
				return { message: 'invalid-user-status', status: 'error' };
			}
			if (error.message === 'credential-not-found') {
				console.warn(
					'Account credential is missing during password reset.'
				);
				return { message: 'server-misconfigured', status: 'error' };
			}
		}

		throw error;
	}

	return { status: 'ok' };
}
