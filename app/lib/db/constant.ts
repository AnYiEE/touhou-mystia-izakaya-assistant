// Define and export table names.
export const DEFAULT_SQLITE_DATABASE_PATH = 'sqlite.db';

export const TABLE_NAME_MAP = {
	backupFileRecord: 'backup_files',
	session: 'sessions',
	user: 'users',
	userCredential: 'user_credentials',
	userState: 'user_state',
} as const;
