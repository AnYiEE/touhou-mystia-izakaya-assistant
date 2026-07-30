import { getConfiguredSqliteDatabasePath } from '@/infrastructure/database/config';

import { createSqliteDatabase } from './createDatabase';

export const database = createSqliteDatabase({
	busyTimeoutMs: 5000,
	databasePath: getConfiguredSqliteDatabasePath(
		process.env.SQLITE_DATABASE_PATH
	),
});
