import { type NextRequest } from 'next/server';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAdminAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import {
	disableUserAndDeleteSessionsWithSsoCallbacksAndAudit,
	findUserById,
	setUserStatusIfCurrentStatusWithAudit,
} from '@/features/account/server/persistence/repositories/users';

type TChangeUserStatusOperation = 'disable' | 'enable' | 'restore';

export type TChangeUserStatusResult =
	| { message: 'target-user-not-found'; status: 'error' }
	| { message: 'update-not-applied'; status: 'error' }
	| { message: 'user-deleted'; status: 'error' }
	| {
			message: 'user-disabled' | 'user-enabled' | 'user-restored';
			status: 'ok';
	  };

const operationMap = {
	disable: {
		action: ACCOUNT_AUDIT_ACTION_MAP.adminDisableUser,
		currentStatus: USER_STATUS_MAP.active,
		message: 'user-disabled',
		nextStatus: USER_STATUS_MAP.disabled,
	},
	enable: {
		action: ACCOUNT_AUDIT_ACTION_MAP.adminEnableUser,
		currentStatus: USER_STATUS_MAP.disabled,
		message: 'user-enabled',
		nextStatus: USER_STATUS_MAP.active,
	},
	restore: {
		action: ACCOUNT_AUDIT_ACTION_MAP.adminRestoreUser,
		currentStatus: USER_STATUS_MAP.deleted,
		message: 'user-restored',
		nextStatus: USER_STATUS_MAP.disabled,
	},
} as const;

export async function changeUserStatus({
	actorId,
	operation,
	request,
	userId,
}: {
	actorId: string;
	operation: TChangeUserStatusOperation;
	request: NextRequest;
	userId: string;
}): Promise<TChangeUserStatusResult> {
	const user = await findUserById(userId);
	if (user === null) {
		return { message: 'target-user-not-found', status: 'error' };
	}

	const policy = operationMap[operation];
	if (operation !== 'restore' && user.status === USER_STATUS_MAP.deleted) {
		return { message: 'user-deleted', status: 'error' };
	}
	if (user.status !== policy.currentStatus) {
		return { message: 'update-not-applied', status: 'error' };
	}

	const writeAuditLog = (
		trx: Parameters<typeof writeAccountAuditLogInTransaction>[0],
		auditNow: number
	) =>
		writeAccountAuditLogInTransaction(
			trx,
			createAccountAdminAuditLogInput({
				action: policy.action,
				adminId: actorId,
				metadata: {
					next_status: policy.nextStatus,
					previous_status: policy.currentStatus,
					target_nickname: user.nickname,
					target_user_id: userId,
					target_username: user.username,
				},
				request,
				targetId: userId,
				targetType: 'user',
			}),
			auditNow
		);

	const isUpdated =
		operation === 'disable'
			? await disableUserAndDeleteSessionsWithSsoCallbacksAndAudit(
					userId,
					writeAuditLog
				)
			: await setUserStatusIfCurrentStatusWithAudit(
					userId,
					policy.currentStatus,
					policy.nextStatus,
					operation === 'restore',
					writeAuditLog
				);

	return isUpdated
		? { message: policy.message, status: 'ok' }
		: { message: 'update-not-applied', status: 'error' };
}
