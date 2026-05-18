import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { env } from 'node:process';

import { TABLE_NAME_MAP, getSqliteDatabasePath } from './constant';
import type { TDatabase } from './types';
import { getTableColumns } from './utils';

// Create and export database instance.
const nativeDatabase = new Database(
	getSqliteDatabasePath(env.SQLITE_DATABASE_PATH)
);
nativeDatabase.pragma('foreign_keys = ON');
nativeDatabase.pragma('busy_timeout = 5000');
nativeDatabase.pragma('journal_mode = WAL');

const dialect = new SqliteDialect({ database: nativeDatabase });
export const db = new Kysely<TDatabase>({ dialect });

// Create backup_files table if it doesn't exist.
await db.schema
	.createTable(TABLE_NAME_MAP.backupFileRecord)
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('created_at', 'integer', (col) => col.notNull())
	.addColumn('last_accessed', 'integer', (col) => col.notNull())
	.addColumn('ip_address', 'text', (col) => col.notNull())
	.addColumn('user_agent', 'text', (col) => col.notNull())
	.addColumn('user_id', 'text', (col) => col.notNull())
	.execute();

await db.schema
	.createTable(TABLE_NAME_MAP.backupCodeLock)
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('owner_id', 'text', (col) => col.notNull())
	.addColumn('expires_at', 'integer', (col) => col.notNull())
	.execute();

const backupFileRecordTableColumns = await getTableColumns(
	db,
	TABLE_NAME_MAP.backupFileRecord
);

// Add user_agent column to old backup_files table if it doesn't exist.
const hasUserAgentColumn = backupFileRecordTableColumns.includes('user_agent');
if (!hasUserAgentColumn) {
	await db.schema
		.alterTable(TABLE_NAME_MAP.backupFileRecord)
		.addColumn('user_agent', 'text', (col) => col.notNull().defaultTo(''))
		.execute();
}

// Add user_id column to old backup_files table if it doesn't exist.
const hasUserIdColumn = backupFileRecordTableColumns.includes('user_id');
if (!hasUserIdColumn) {
	await db.schema
		.alterTable(TABLE_NAME_MAP.backupFileRecord)
		.addColumn('user_id', 'text', (col) => col.notNull().defaultTo(''))
		.execute();
}
