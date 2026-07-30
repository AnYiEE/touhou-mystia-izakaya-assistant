import { type NextRequest } from 'next/server';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAuditValueDigest,
	createAccountUserAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { type IAuthenticatedAccount } from '@/features/account/server/auth/requestAuthentication';
import { deleteActiveUserIfSessionCurrentWithAudit } from '@/features/account/server/persistence/repositories/users';

export async function deleteAccount(
	account: IAuthenticatedAccount,
	request: NextRequest
) {
	return deleteActiveUserIfSessionCurrentWithAudit(
		account.user.id,
		{ id: account.session.id, token_hash: account.session.token_hash },
		(trx, auditNow) =>
			writeAccountAuditLogInTransaction(
				trx,
				createAccountUserAuditLogInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.accountDeleted,
					metadata: {
						auth_record_digest: createAccountAuditValueDigest(
							account.session.id
						),
						nickname: account.user.nickname,
						username: account.user.username,
					},
					request,
					userId: account.user.id,
				}),
				auditNow
			)
	);
}
