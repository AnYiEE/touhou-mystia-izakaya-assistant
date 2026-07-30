import { type NextRequest } from 'next/server';
import { randomBytes, randomUUID } from 'node:crypto';

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
import { createUserWithCredentialWebauthnAndSession } from '@/features/account/server/persistence/repositories/users';
import {
	createAutoAccountUsername,
	normalizeUsername,
} from '@/features/account/server/presentation/user';

import type {
	TUser,
	TUserWebauthnCredentialNew,
} from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

function createTemporaryPassword() {
	return randomBytes(48).toString('base64url');
}

export type TRegisterWithPasskeyResult =
	| { message: 'server-misconfigured' | 'username-conflict'; status: 'error' }
	| {
			session: ReturnType<typeof createAccountSessionDraft>;
			status: 'ok';
			user: TUser;
	  };

export async function registerWithPasskey({
	credential,
	request,
	userId,
}: {
	credential: Omit<
		TUserWebauthnCredentialNew,
		'created_at' | 'id' | 'last_used_at' | 'user_id'
	>;
	request: NextRequest;
	userId: string;
}): Promise<TRegisterWithPasskeyResult> {
	const now = Date.now();
	const session = createAccountSessionDraft(userId, request, now);
	let user = null;
	try {
		for (let attempt = 0; attempt < 5; attempt++) {
			const username = createAutoAccountUsername(userId, attempt);
			user = await createUserWithCredentialWebauthnAndSession(
				{
					created_at: now,
					deleted_at: null,
					id: userId,
					last_login_at: now,
					nickname: null,
					state_epoch: 0,
					status: USER_STATUS_MAP.active,
					sync_generation: 0,
					sync_status: ACCOUNT_SYNC_STATUS_MAP.active,
					updated_at: now,
					username,
					username_normalized: normalizeUsername(username),
				},
				{
					failed_attempts: 0,
					locked_until: null,
					password_hash: await hashPassword(
						createTemporaryPassword()
					),
					password_must_change: 0,
					password_set: 0,
					updated_at: now,
					user_id: userId,
				},
				{
					...credential,
					created_at: now,
					id: randomUUID(),
					last_used_at: now,
					user_id: userId,
				},
				session.record,
				async (trx, auditNow, createdUser) => {
					await writeAccountAuditLogInTransaction(
						trx,
						createAccountUserAuditLogInput({
							action: ACCOUNT_AUDIT_ACTION_MAP.passkeyAccountRegistered,
							metadata: {
								auth_record_digest:
									createAccountAuditValueDigest(
										session.record.id
									),
								auto_username: true,
								backed_up: credential.backed_up === 1,
								credential_name: credential.name,
								device_type: credential.device_type,
								method: 'passkey',
								nickname: null,
								username,
							},
							request,
							userId: createdUser.id,
						}),
						auditNow
					);
					await writeAccountAuditLogInTransaction(
						trx,
						createAccountUserAuditLogInput({
							action: ACCOUNT_AUDIT_ACTION_MAP.loginSucceeded,
							metadata: {
								method: 'passkey',
								must_change_on_next_login: false,
								nickname: null,
								username,
							},
							request,
							userId: createdUser.id,
						}),
						auditNow
					);
				}
			);
			if (user !== null) {
				break;
			}
		}
	} catch (error) {
		console.warn('Failed to register account with passkey.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return { message: 'server-misconfigured', status: 'error' };
	}

	return user === null
		? { message: 'username-conflict', status: 'error' }
		: { session, status: 'ok', user };
}
