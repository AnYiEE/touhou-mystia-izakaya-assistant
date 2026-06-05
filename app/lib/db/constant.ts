import { isAbsolute, resolve } from 'node:path';

// Define and export table names.
export const DEFAULT_SQLITE_DATABASE_PATH = 'sqlite.db';

export function getSqliteDatabasePath(databasePath: string | undefined) {
	const trimmedDatabasePath = databasePath?.trim();

	return trimmedDatabasePath === undefined || trimmedDatabasePath === ''
		? resolve(DEFAULT_SQLITE_DATABASE_PATH)
		: trimmedDatabasePath;
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
	backupCodeLock: 'backup_code_locks',
	backupFileRecord: 'backup_files',
	backupImportRecord: 'backup_imports',
	session: 'sessions',
	user: 'users',
	userCredential: 'user_credentials',
	userState: 'user_state',
} as const;
