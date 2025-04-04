import Database from 'better-sqlite3';
import {Kysely, SqliteDialect} from 'kysely';

import type {TDatabase} from './types';

export const TABLE_NAME_BACKUP_FILE_RECORD = 'backup_files';

const dialect = new SqliteDialect({
	database: new Database('sqlite.db'),
});

export const db = new Kysely<TDatabase>({
	dialect,
});

await db.schema
	.createTable(TABLE_NAME_BACKUP_FILE_RECORD)
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('created_at', 'integer', (col) => col.notNull())
	.addColumn('last_accessed', 'integer', (col) => col.notNull())
	.addColumn('ip_address', 'text', (col) => col.notNull())
	.execute();
