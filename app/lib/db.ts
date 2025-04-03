import Database from 'better-sqlite3';
import {Kysely, SqliteDialect} from 'kysely';

import type {TDatabase} from './types';

const dialect = new SqliteDialect({
	database: new Database('sqlite.db'),
});

export const db = new Kysely<TDatabase>({
	dialect,
});

await db.schema
	.createTable('backup_files')
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('file_path', 'text', (col) => col.notNull())
	.addColumn('created_at', 'integer', (col) => col.notNull())
	.addColumn('last_accessed', 'integer', (col) => col.notNull())
	.addColumn('ip_address', 'text', (col) => col.notNull())
	.execute();
