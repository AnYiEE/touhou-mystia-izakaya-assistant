import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import {
	ACCOUNT_SYNC_STATUS_MAP,
	USER_STATUS_MAP,
} from '@/domain/account/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAuditValueDigest,
	createAccountUserAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { hashPassword } from '@/features/account/server/auth/password';
import { createAccountSessionDraft } from '@/features/account/server/auth/sessionLifecycle';
import {
	createUserWithCredentialAndSession,
	findUserByUsernameNormalized,
} from '@/features/account/server/persistence/repositories/users';

import type { TUser } from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export type TRegisterWithPasswordResult =
	| { message: 'server-misconfigured' | 'username-conflict'; status: 'error' }
	| {
			session: ReturnType<typeof createAccountSessionDraft>;
			status: 'ok';
			user: TUser;
	  };

export async function registerWithPassword({
	nickname,
	password,
	request,
	username,
	usernameNormalized,
}: {
	nickname: string | null;
	password: string;
	request: NextRequest;
	username: string;
	usernameNormalized: string;
}): Promise<TRegisterWithPasswordResult> {
	const existingUser = await findUserByUsernameNormalized(usernameNormalized);
	if (existingUser !== null) {
		return { message: 'username-conflict', status: 'error' };
	}

	const now = Date.now();
	const userId = randomUUID();
	let session: ReturnType<typeof createAccountSessionDraft>;
	let user: Awaited<ReturnType<typeof createUserWithCredentialAndSession>>;
	try {
		const passwordHash = await hashPassword(password);
		session = createAccountSessionDraft(userId, request, now);
		user = await createUserWithCredentialAndSession(
			{
				created_at: now,
				deleted_at: null,
				id: userId,
				last_login_at: now,
				nickname,
				state_epoch: 0,
				status: USER_STATUS_MAP.active,
				sync_generation: 0,
				sync_status: ACCOUNT_SYNC_STATUS_MAP.active,
				updated_at: now,
				username,
				username_normalized: usernameNormalized,
			},
			{
				failed_attempts: 0,
				locked_until: null,
				password_hash: passwordHash,
				password_must_change: 0,
				password_set: 1,
				updated_at: now,
				user_id: userId,
			},
			session.record,
			(trx, auditNow, createdUser) =>
				writeAccountAuditLogInTransaction(
					trx,
					createAccountUserAuditLogInput({
						action: ACCOUNT_AUDIT_ACTION_MAP.registered,
						metadata: {
							auth_record_digest: createAccountAuditValueDigest(
								session.record.id
							),
							nickname,
							username,
						},
						request,
						userId: createdUser.id,
					}),
					auditNow
				)
		);
	} catch (error) {
		console.warn('Failed to create account registration records.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return { message: 'server-misconfigured', status: 'error' };
	}

	if (user === null) {
		return { message: 'username-conflict', status: 'error' };
	}
	return { session, status: 'ok', user };
}
