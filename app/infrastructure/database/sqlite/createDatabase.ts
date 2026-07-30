import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { isAbsolute } from 'node:path';

import type { TDatabase } from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export interface ICreateSqliteDatabaseOptions {
	busyTimeoutMs?: number;
	databasePath: string;
}

export function createSqliteDatabase({
	busyTimeoutMs = 5000,
	databasePath,
}: ICreateSqliteDatabaseOptions): Kysely<TDatabase> {
	let nativeDatabase: Database.Database | undefined;

	try {
		if (!isAbsolute(databasePath)) {
			throw new Error('sqlite-database-path-must-be-absolute');
		}
		if (!Number.isSafeInteger(busyTimeoutMs) || busyTimeoutMs < 0) {
			throw new Error('sqlite-busy-timeout-invalid');
		}

		nativeDatabase = new Database(databasePath);
		nativeDatabase.pragma('foreign_keys = ON');
		nativeDatabase.pragma(`busy_timeout = ${busyTimeoutMs}`);
		nativeDatabase.pragma('journal_mode = WAL');

		return new Kysely<TDatabase>({
			dialect: new SqliteDialect({ database: nativeDatabase }),
		});
	} catch (error) {
		nativeDatabase?.close();
		console.warn('SQLite database initialization failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		throw error;
	}
}
