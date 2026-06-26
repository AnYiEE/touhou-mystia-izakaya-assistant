import { type NextRequest } from 'next/server';
import { type Transaction } from 'kysely';

import { createAccountHmac } from './crypto';
import { getRequestAuditContext } from './request';
import {
	type IAuditLogWriteInput,
	cleanupAuditLogs,
	writeAuditLog,
	writeAuditLogInTransaction,
} from '@/lib/account/server/repositories/auditLogs';
import { getLogSafeErrorCode } from '@/lib/logging';
import { type TDatabase, type TUser } from '@/lib/db/types';

export const ACCOUNT_AUDIT_SCOPE = 'account';
export const ACCOUNT_AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
export const ACCOUNT_AUDIT_LOG_MAX_ROWS = 100_000;
const ACCOUNT_AUDIT_LOG_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastAccountAuditLogCleanupAt = 0;

export const ACCOUNT_AUDIT_ACTION_MAP = {
	accountDataCleared: 'user-clear-account-data',
	accountDataExported: 'user-export-account-data',
	accountDeleted: 'user-delete-account',
	adminClearUserData: 'admin-clear-user-data',
	adminDeleteUserSessions: 'admin-delete-user-sessions',
	adminDisableUser: 'admin-disable-user',
	adminEnableUser: 'admin-enable-user',
	adminResetPassword: 'admin-reset-user-password',
	adminRestoreUser: 'admin-restore-user',
	authorizeSsoClient: 'user-authorize-sso-client',
	loginFailed: 'user-login-failed',
	loginSucceeded: 'user-login-succeeded',
	logout: 'user-logout-session',
	logoutAll: 'user-logout-all-sessions',
	nicknameChanged: 'user-change-nickname',
	passkeyDeleted: 'user-delete-passkey',
	passkeyRegistered: 'user-register-passkey',
	passwordChanged: 'user-change-password',
	registered: 'user-register-account',
	sessionRevoked: 'user-revoke-session',
	ssoGrantRevoked: 'user-revoke-sso-grant',
	usernameChanged: 'user-change-username',
} as const;

export type TAccountAuditAction =
	(typeof ACCOUNT_AUDIT_ACTION_MAP)[keyof typeof ACCOUNT_AUDIT_ACTION_MAP];

export function createAccountAuditValueDigest(value: string) {
	return `hmac-sha256:${createAccountHmac('audit-value:v1', value).slice(
		0,
		32
	)}`;
}

function createAccountAuditLogInput({
	action,
	actorId,
	actorType,
	metadata,
	request,
	targetId,
	targetType,
}: {
	action: TAccountAuditAction;
	actorId: string | null;
	actorType: IAuditLogWriteInput['actorType'];
	metadata: Record<string, unknown> | undefined;
	request: NextRequest;
	targetId: string | null;
	targetType: string;
}): IAuditLogWriteInput {
	const input: IAuditLogWriteInput = {
		...getRequestAuditContext(request),
		action,
		actorId,
		actorType,
		scope: ACCOUNT_AUDIT_SCOPE,
		targetId,
		targetType,
	};

	if (metadata !== undefined) {
		input.metadata = metadata;
	}

	return input;
}

export function createAccountUserAuditLogInput({
	action,
	metadata,
	request,
	userId,
}: {
	action: TAccountAuditAction;
	metadata?: Record<string, unknown>;
	request: NextRequest;
	userId: TUser['id'];
}): IAuditLogWriteInput {
	return createAccountAuditLogInput({
		action,
		actorId: userId,
		actorType: 'user',
		metadata,
		request,
		targetId: userId,
		targetType: 'user',
	});
}

export function createAccountSystemAuditLogInput({
	action,
	metadata,
	request,
	targetId,
	targetType = 'user',
}: {
	action: TAccountAuditAction;
	metadata?: Record<string, unknown>;
	request: NextRequest;
	targetId: string | null;
	targetType?: string;
}): IAuditLogWriteInput {
	return createAccountAuditLogInput({
		action,
		actorId: null,
		actorType: 'system',
		metadata,
		request,
		targetId,
		targetType,
	});
}

export function createAccountAdminAuditLogInput({
	action,
	adminId,
	metadata,
	request,
	targetId,
	targetType,
}: {
	action: TAccountAuditAction;
	adminId: string | null;
	metadata?: Record<string, unknown>;
	request: NextRequest;
	targetId: string | null;
	targetType: string;
}): IAuditLogWriteInput {
	return createAccountAuditLogInput({
		action,
		actorId: adminId,
		actorType: 'admin',
		metadata,
		request,
		targetId,
		targetType,
	});
}

export async function cleanupAccountAuditLogsBestEffort(now = Date.now()) {
	if (
		now - lastAccountAuditLogCleanupAt <
		ACCOUNT_AUDIT_LOG_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAccountAuditLogCleanupAt = now;
	try {
		await cleanupAuditLogs({
			before: now - ACCOUNT_AUDIT_LOG_RETENTION_MS,
			maxRows: ACCOUNT_AUDIT_LOG_MAX_ROWS,
			scope: ACCOUNT_AUDIT_SCOPE,
		});
	} catch (error) {
		console.warn('Failed to clean up account audit logs.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function writeAccountAuditLog(input: IAuditLogWriteInput) {
	await writeAuditLog(input);
	void cleanupAccountAuditLogsBestEffort();
}

export async function writeAccountAuditLogInTransaction(
	trx: Transaction<TDatabase>,
	input: IAuditLogWriteInput,
	now = Date.now()
) {
	await writeAuditLogInTransaction(trx, input, now);
}

export async function writeAccountAuditLogBestEffort(
	input: IAuditLogWriteInput
) {
	try {
		await writeAccountAuditLog(input);
	} catch (error) {
		console.warn('Failed to write account audit log.', {
			action: input.action,
			errorCode: getLogSafeErrorCode(error),
			targetType: input.targetType,
		});
	}
}
