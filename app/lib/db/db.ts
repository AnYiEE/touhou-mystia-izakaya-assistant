import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { env } from 'node:process';

import { TABLE_NAME_MAP, getConfiguredSqliteDatabasePath } from './constant';
import type { TDatabase } from './types';
import { getTableColumns } from './utils';
import { getLogSafeErrorCode } from '../logging';

let nativeDatabase: Database.Database;
let sqliteDatabasePath = '';
try {
	sqliteDatabasePath = getConfiguredSqliteDatabasePath(
		env.SQLITE_DATABASE_PATH
	);
	nativeDatabase = new Database(sqliteDatabasePath);
	nativeDatabase.pragma('foreign_keys = ON');
	nativeDatabase.pragma('busy_timeout = 5000');
	nativeDatabase.pragma('journal_mode = WAL');
} catch (error) {
	console.warn('SQLite database initialization failed.', {
		errorCode: getLogSafeErrorCode(error),
		sqliteDatabasePath,
	});
	throw error;
}

const dialect = new SqliteDialect({ database: nativeDatabase });
export const db = new Kysely<TDatabase>({ dialect });

function checkDuplicateColumnError(error: unknown) {
	return (
		error instanceof Error && /duplicate column name/iu.test(error.message)
	);
}

async function addBackupFileRecordColumnIfMissing(
	columns: string[],
	columnName: 'file_name' | 'user_agent' | 'user_id'
) {
	if (columns.includes(columnName)) {
		return;
	}

	try {
		const alterTable = db.schema.alterTable(
			TABLE_NAME_MAP.backupFileRecord
		);

		const addColumn =
			columnName === 'file_name'
				? alterTable.addColumn(columnName, 'text')
				: alterTable.addColumn(columnName, 'text', (col) =>
						col.notNull().defaultTo('')
					);

		await addColumn.execute();
	} catch (error) {
		if (checkDuplicateColumnError(error)) {
			return;
		}

		throw error;
	}
}

// Create backup_files table if it doesn't exist.
await db.schema
	.createTable(TABLE_NAME_MAP.backupFileRecord)
	.ifNotExists()
	.addColumn('code', 'text', (col) => col.primaryKey())
	.addColumn('created_at', 'integer', (col) => col.notNull())
	.addColumn('file_name', 'text')
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

// Add file_name column to old backup_files table if it doesn't exist.
await addBackupFileRecordColumnIfMissing(
	backupFileRecordTableColumns,
	'file_name'
);

// Add user_agent column to old backup_files table if it doesn't exist.
await addBackupFileRecordColumnIfMissing(
	backupFileRecordTableColumns,
	'user_agent'
);

// Add user_id column to old backup_files table if it doesn't exist.
await addBackupFileRecordColumnIfMissing(
	backupFileRecordTableColumns,
	'user_id'
);
