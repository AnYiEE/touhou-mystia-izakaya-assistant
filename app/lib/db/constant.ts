import { isAbsolute, resolve } from 'node:path';

export const DEFAULT_SQLITE_DATABASE_PATH = 'sqlite.db';

export function getSqliteDatabasePath(databasePath: string | undefined) {
	const trimmedDatabasePath = databasePath?.trim();

	return trimmedDatabasePath === undefined || trimmedDatabasePath === ''
		? resolve(DEFAULT_SQLITE_DATABASE_PATH)
		: resolve(trimmedDatabasePath);
}

export function getConfiguredSqliteDatabasePath(
	databasePath: string | undefined
) {
	const trimmedDatabasePath = databasePath?.trim();
	if (trimmedDatabasePath === undefined || trimmedDatabasePath === '') {
		return getSqliteDatabasePath(trimmedDatabasePath);
	}

	if (!isAbsolute(trimmedDatabasePath)) {
		throw new Error('sqlite-database-path-must-be-absolute');
	}

	return resolve(trimmedDatabasePath);
}

export const TABLE_NAME_MAP = {
	announcement: 'announcements',
	announcementDismissal: 'announcement_dismissals',
	announcementVersion: 'announcement_versions',
	backupCodeLock: 'backup_code_locks',
	backupFileRecord: 'backup_files',
	backupImportRecord: 'backup_imports',
	session: 'sessions',
	ssoCallbackQueue: 'sso_callback_queue',
	ssoClient: 'sso_clients',
	ssoTicket: 'sso_tickets',
	ssoUserClientGrant: 'sso_user_client_grants',
	user: 'users',
	userCredential: 'user_credentials',
	userState: 'user_state',
} as const;
