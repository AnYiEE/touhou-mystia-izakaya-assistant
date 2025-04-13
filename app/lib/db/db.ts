import Database from 'better-sqlite3';
import {Kysely, SqliteDialect} from 'kysely';

import {TABLE_NAME_MAP} from './constant';
import type {TDatabase} from './types';
import {getTableColumns} from './utils';

// Create and export database instance.
const dialect = new SqliteDialect({
	database: new Database('sqlite.db'),
});
export const db = new Kysely<TDatabase>({
	dialect,
});

// Create backup_files table if it doesn't exist.
await db.schema
	.createTable(TABLE_NAME_MAP.backupFileRecord)
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('created_at', 'integer', (col) => col.notNull())
	.addColumn('last_accessed', 'integer', (col) => col.notNull())
	.addColumn('ip_address', 'text', (col) => col.notNull())
	.addColumn('user_agent', 'text', (col) => col.notNull())
	.execute();

// Add user_agent column to old backup_files table if it doesn't exist.
const backupFileRecordTableColumns = await getTableColumns(db, TABLE_NAME_MAP.backupFileRecord);
const hasUserAgentColumn = backupFileRecordTableColumns.includes('user_agent');
if (!hasUserAgentColumn) {
	await db.schema
		.alterTable(TABLE_NAME_MAP.backupFileRecord)
		.addColumn('user_agent', 'text', (col) => col.notNull().defaultTo(''))
		.execute();
}
