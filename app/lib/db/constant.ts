// Define and export table names.
export const DEFAULT_SQLITE_DATABASE_PATH = 'sqlite.db';

export function getSqliteDatabasePath(databasePath: string | undefined) {
	const trimmedDatabasePath = databasePath?.trim();

	return trimmedDatabasePath === undefined || trimmedDatabasePath === ''
		? DEFAULT_SQLITE_DATABASE_PATH
		: trimmedDatabasePath;
}

export const TABLE_NAME_MAP = {
	backupCodeLock: 'backup_code_locks',
	backupFileRecord: 'backup_files',
	session: 'sessions',
	user: 'users',
	userCredential: 'user_credentials',
	userState: 'user_state',
} as const;
