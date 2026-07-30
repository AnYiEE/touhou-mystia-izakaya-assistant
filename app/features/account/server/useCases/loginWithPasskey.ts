import { type NextRequest } from 'next/server';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountUserAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { createAccountSessionForActiveUser } from '@/features/account/server/auth/sessionLifecycle';
import { getCredentialByUserId } from '@/features/account/server/persistence/repositories/credentials';

import type {
	TUser,
	TUserWebauthnCredential,
} from '@/infrastructure/database/schema';

export type TLoginWithPasskeyResult =
	| { reason: 'session-create-failed'; status: 'error'; targetId: string }
	| {
			hasPassword: boolean;
			passwordMustChange: boolean;
			session: Extract<
				Awaited<ReturnType<typeof createAccountSessionForActiveUser>>,
				{ status: 'ok' }
			>;
			status: 'ok';
			user: TUser;
	  };

export async function loginWithPasskey({
	credential,
	nextCounter,
	request,
	user,
}: {
	credential: TUserWebauthnCredential;
	nextCounter: number;
	request: NextRequest;
	user: TUser;
}): Promise<TLoginWithPasskeyResult> {
	const now = Date.now();
	const passwordCredential = await getCredentialByUserId(user.id);
	const hasPassword = passwordCredential?.password_set === 1;
	const passwordMustChange = passwordCredential?.password_must_change === 1;
	const session = await createAccountSessionForActiveUser(
		user.id,
		request,
		{ last_login_at: now, updated_at: now },
		undefined,
		(trx, auditNow) =>
			writeAccountAuditLogInTransaction(
				trx,
				createAccountUserAuditLogInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.loginSucceeded,
					metadata: {
						method: 'passkey',
						must_change_on_next_login: passwordMustChange,
						nickname: user.nickname,
						username: user.username,
					},
					request,
					userId: user.id,
				}),
				auditNow
			),
		{
			credentialId: credential.credential_id,
			expectedCounter: credential.counter,
			id: credential.id,
			lastUsedAt: now,
			nextCounter,
		}
	);
	if (session.status !== 'ok') {
		return {
			reason: 'session-create-failed',
			status: 'error',
			targetId: user.id,
		};
	}

	return {
		hasPassword,
		passwordMustChange,
		session,
		status: 'ok',
		user: { ...user, last_login_at: now, updated_at: now },
	};
}
