import { type Kysely, sql } from 'kysely';

import type { TDatabase } from '@/infrastructure/database/schema';
import { dropMismatchedSqliteIndexes } from '@/infrastructure/database/sqlite/indexes';
import { addMissingSqliteColumn } from '@/infrastructure/database/sqlite/migrationColumns';
import {
	type ISqliteAcceptedCreateTableShape,
	checkSqliteCreateTableShapeAccepted,
} from '@/infrastructure/database/sqlite/tableDefinition';
import {
	type ISqliteTableColumnInfo,
	getCreateTableSql,
	getForeignKeys,
	getTableColumnInfo,
	getTableColumns,
	getTableSchemaObjects,
} from '@/infrastructure/database/sqlite/tableIntrospection';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

const BACKUP_FILE_NEXT_TABLE_NAME = '__migration_backup_files_next';
const BACKUP_CODE_LOCK_NEXT_TABLE_NAME = '__migration_backup_code_locks_next';
const LEGACY_BACKUP_STRUCTURE_ERROR =
	'server-misconfigured: legacy-backup-table-structure';

const BACKUP_FILE_COLUMNS = {
	code: { notNull: true, primaryKeyOrdinal: 1, type: 'text' },
	created_at: { notNull: true, primaryKeyOrdinal: 0, type: 'integer' },
	file_name: { notNull: false, primaryKeyOrdinal: 0, type: 'text' },
	ip_address: { notNull: true, primaryKeyOrdinal: 0, type: 'text' },
	last_accessed: { notNull: true, primaryKeyOrdinal: 0, type: 'integer' },
	user_agent: {
		allowedDefaultValues: [null, "''"],
		notNull: true,
		primaryKeyOrdinal: 0,
		type: 'text',
	},
	user_id: {
		allowedDefaultValues: [null, "''"],
		notNull: true,
		primaryKeyOrdinal: 0,
		type: 'text',
	},
} as const;
const BACKUP_FILE_V160_SOURCE_COLUMNS = {
	...BACKUP_FILE_COLUMNS,
	file_path: { notNull: true, primaryKeyOrdinal: 0, type: 'text' },
} as const;
const BACKUP_FILE_V160_TARGET_COLUMNS = {
	...BACKUP_FILE_COLUMNS,
	file_path: { notNull: false, primaryKeyOrdinal: 0, type: 'text' },
} as const;
const BACKUP_FILE_STRUCTURAL_COLUMNS = [
	'code',
	'created_at',
	'last_accessed',
	'ip_address',
] as const;

const BACKUP_CODE_LOCK_COLUMNS = {
	code: { notNull: true, primaryKeyOrdinal: 1, type: 'text' },
	expires_at: { notNull: true, primaryKeyOrdinal: 0, type: 'integer' },
	owner_id: { notNull: true, primaryKeyOrdinal: 0, type: 'text' },
} as const;

const BACKUP_FILE_CREATE_TABLE_COLUMN_MAP = {
	code: { constraint: 'primary key', name: 'code', type: 'text' },
	created_at: { constraint: 'not null', name: 'created_at', type: 'integer' },
	file_name: { constraint: '', name: 'file_name', type: 'text' },
	file_path: { constraint: 'not null', name: 'file_path', type: 'text' },
	ip_address: { constraint: 'not null', name: 'ip_address', type: 'text' },
	last_accessed: {
		constraint: 'not null',
		name: 'last_accessed',
		type: 'integer',
	},
	user_agent: { constraint: 'not null', name: 'user_agent', type: 'text' },
	user_id: { constraint: 'not null', name: 'user_id', type: 'text' },
} as const;

type TBackupFileColumnName = keyof typeof BACKUP_FILE_CREATE_TABLE_COLUMN_MAP;

function createBackupFileAcceptedShape(
	columnNames: ReadonlyArray<TBackupFileColumnName>,
	userAgentConstraint: 'not null' | "default '' not null",
	userIdConstraint: 'not null' | "default '' not null"
): ISqliteAcceptedCreateTableShape {
	return {
		columns: columnNames.map((name) => {
			const definition = BACKUP_FILE_CREATE_TABLE_COLUMN_MAP[name];
			if (name === 'user_agent') {
				return { ...definition, constraint: userAgentConstraint };
			}
			if (name === 'user_id') {
				return { ...definition, constraint: userIdConstraint };
			}
			return definition;
		}),
		tableName: TABLE_NAME_MAP.backupFileRecord,
	};
}

const BACKUP_FILE_ACCEPTED_CREATE_TABLE_SHAPES = [
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'file_name',
			'last_accessed',
			'ip_address',
			'user_agent',
			'user_id',
		],
		'not null',
		'not null'
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'user_id',
			'file_name',
		],
		'not null',
		'not null'
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'user_id',
			'file_name',
		],
		'not null',
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'user_id',
			'file_name',
		],
		"default '' not null",
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'file_name',
			'user_id',
		],
		'not null',
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'file_name',
			'user_id',
		],
		"default '' not null",
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'created_at',
			'last_accessed',
			'ip_address',
			'file_name',
			'user_agent',
			'user_id',
		],
		"default '' not null",
		"default '' not null"
	),
] as const satisfies ReadonlyArray<ISqliteAcceptedCreateTableShape>;

const BACKUP_FILE_V160_ACCEPTED_CREATE_TABLE_SHAPES = [
	createBackupFileAcceptedShape(
		[
			'code',
			'file_path',
			'created_at',
			'last_accessed',
			'ip_address',
			'file_name',
			'user_agent',
			'user_id',
		],
		"default '' not null",
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'file_path',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'file_name',
			'user_id',
		],
		"default '' not null",
		"default '' not null"
	),
	createBackupFileAcceptedShape(
		[
			'code',
			'file_path',
			'created_at',
			'last_accessed',
			'ip_address',
			'user_agent',
			'user_id',
			'file_name',
		],
		"default '' not null",
		"default '' not null"
	),
] as const satisfies ReadonlyArray<ISqliteAcceptedCreateTableShape>;

const BACKUP_FILE_V160_TARGET_CREATE_TABLE_SHAPES = [
	{
		columns: [
			{ constraint: 'not null primary key', name: 'code', type: 'text' },
			{ constraint: '', name: 'file_path', type: 'text' },
			{ constraint: 'not null', name: 'created_at', type: 'integer' },
			{ constraint: 'not null', name: 'last_accessed', type: 'integer' },
			{ constraint: 'not null', name: 'ip_address', type: 'text' },
			{
				constraint: "default '' not null",
				name: 'user_agent',
				type: 'text',
			},
			{
				constraint: "default '' not null",
				name: 'user_id',
				type: 'text',
			},
			{ constraint: '', name: 'file_name', type: 'text' },
		],
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
] as const satisfies ReadonlyArray<ISqliteAcceptedCreateTableShape>;

const BACKUP_CODE_LOCK_ACCEPTED_CREATE_TABLE_SHAPES = [
	{
		columns: [
			{ constraint: 'primary key', name: 'code', type: 'text' },
			{ constraint: 'not null', name: 'owner_id', type: 'text' },
			{ constraint: 'not null', name: 'expires_at', type: 'integer' },
		],
		tableName: TABLE_NAME_MAP.backupCodeLock,
	},
] as const satisfies ReadonlyArray<ISqliteAcceptedCreateTableShape>;

const BACKUP_FILE_INDEX_DEFINITIONS = [
	{
		columns: ['ip_address', 'created_at'],
		indexName: 'backup_files_ip_created_index',
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
	{
		columns: ['ip_address', 'last_accessed'],
		indexName: 'backup_files_ip_last_accessed_index',
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
	{
		columns: ['last_accessed'],
		indexName: 'backup_files_last_accessed_index',
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
	{
		columns: ['created_at'],
		indexName: 'backup_files_created_at_index',
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
	{
		columns: ['ip_address', 'user_agent', 'user_id', 'created_at'],
		indexName: 'backup_files_ip_ua_user_created_index',
		tableName: TABLE_NAME_MAP.backupFileRecord,
	},
] as const;

type TExpectedColumnMap = Record<
	string,
	{
		allowedDefaultValues?: ReadonlyArray<string | null>;
		notNull: boolean;
		primaryKeyOrdinal: number;
		type: string;
	}
>;

async function addBackupFileRecordColumnIfMissing(
	database: Kysely<TDatabase>,
	columns: string[],
	columnName: 'file_name' | 'user_agent' | 'user_id'
) {
	if (columns.includes(columnName)) {
		return;
	}

	await addMissingSqliteColumn(
		database,
		TABLE_NAME_MAP.backupFileRecord,
		columnName,
		columnName === 'file_name'
			? { dataType: 'text' }
			: { dataType: 'text', defaultTo: '', notNull: true }
	);
}

function checkRequiredTableStructure(
	columns: ISqliteTableColumnInfo[],
	expectedColumns: TExpectedColumnMap,
	primaryKeyName: string
) {
	for (const [name, expected] of Object.entries(expectedColumns)) {
		const column = columns.find((candidate) => candidate.name === name);
		const allowedDefaultValues = expected.allowedDefaultValues ?? [null];
		if (
			column?.type !== expected.type ||
			column.hidden !== 0 ||
			column.primaryKeyOrdinal !== expected.primaryKeyOrdinal ||
			!allowedDefaultValues.includes(column.defaultValue) ||
			(name !== primaryKeyName && column.notNull !== expected.notNull)
		) {
			throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
		}
	}

	const primaryKeyColumns = columns.filter(
		(column) => column.primaryKeyOrdinal > 0
	);
	const [primaryKeyColumn] = primaryKeyColumns;
	if (
		primaryKeyColumns.length !== 1 ||
		primaryKeyColumn?.name !== primaryKeyName ||
		primaryKeyColumn.primaryKeyOrdinal !== 1
	) {
		throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
	}

	return primaryKeyColumn.notNull;
}

async function checkRebuildShape(
	database: Kysely<TDatabase>,
	tableName: string,
	columns: ISqliteTableColumnInfo[],
	expectedColumns: TExpectedColumnMap,
	acceptedCreateTableShapes: ReadonlyArray<ISqliteAcceptedCreateTableShape>,
	allowedIndexNames: ReadonlyArray<string>
) {
	const expectedColumnNames = Object.keys(expectedColumns);
	const [createTableSql, foreignKeys, schemaObjects] = await Promise.all([
		getCreateTableSql(database, tableName),
		getForeignKeys(database, tableName),
		getTableSchemaObjects(database, tableName),
	]);
	if (
		columns.length !== expectedColumnNames.length ||
		columns.some((column) => !expectedColumnNames.includes(column.name)) ||
		createTableSql === null ||
		!checkSqliteCreateTableShapeAccepted(
			createTableSql,
			acceptedCreateTableShapes
		) ||
		foreignKeys.length > 0 ||
		schemaObjects.some(
			(schemaObject) =>
				schemaObject.type !== 'index' ||
				schemaObject.origin !== 'c' ||
				!allowedIndexNames.includes(schemaObject.name)
		)
	) {
		throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
	}
}

async function checkTableExists(
	database: Kysely<TDatabase>,
	tableName: string
) {
	const { rows } = await sql<{ name: string }>`
		select name
		from sqlite_master
		where type = 'table' and name = ${tableName}
	`.execute(database);

	return rows.length > 0;
}

async function getRowCount(
	database: Kysely<TDatabase>,
	query: ReturnType<typeof sql>
) {
	const { rows } = await query.execute(database);
	const count = (rows[0] as { count?: unknown } | undefined)?.count;
	if (typeof count !== 'number' || !Number.isSafeInteger(count)) {
		throw new TypeError(LEGACY_BACKUP_STRUCTURE_ERROR);
	}

	return count;
}

async function rebuildBackupFileTable(
	database: Kysely<TDatabase>,
	columns: ISqliteTableColumnInfo[],
	hasLegacyFilePathColumn: boolean
) {
	const backupFileTableName = sql.raw(TABLE_NAME_MAP.backupFileRecord);
	const nextTableName = sql.raw(BACKUP_FILE_NEXT_TABLE_NAME);
	const invalidRowCount = await getRowCount(
		database,
		sql`
			select count(*) as count
			from ${backupFileTableName}
			where code is null
				or created_at is null
				or last_accessed is null
				or ip_address is null
				or user_agent is null
				or user_id is null
		`
	);
	if (invalidRowCount > 0) {
		throw new Error('server-misconfigured: backup-files-invalid-rows');
	}

	const sourceRowCount = await getRowCount(
		database,
		sql`select count(*) as count from ${backupFileTableName}`
	);
	const userAgentDefaultValue = columns.find(
		(column) => column.name === 'user_agent'
	)?.defaultValue;
	const userIdDefaultValue = columns.find(
		(column) => column.name === 'user_id'
	)?.defaultValue;
	if (hasLegacyFilePathColumn) {
		await sql`
			create table ${nextTableName} (
				code text not null primary key,
				file_path text,
				created_at integer not null,
				last_accessed integer not null,
				ip_address text not null,
				user_agent text default '' not null,
				user_id text default '' not null,
				file_name text
			)
		`.execute(database);
		await sql`
			insert into ${nextTableName} (
				code,
				file_path,
				created_at,
				last_accessed,
				ip_address,
				user_agent,
				user_id,
				file_name
			)
			select
				code,
				file_path,
				created_at,
				last_accessed,
				ip_address,
				user_agent,
				user_id,
				file_name
			from ${backupFileTableName}
		`.execute(database);
	} else {
		await database.schema
			.createTable(BACKUP_FILE_NEXT_TABLE_NAME)
			.addColumn('code', 'text', (column) =>
				column.notNull().primaryKey()
			)
			.addColumn('created_at', 'integer', (column) => column.notNull())
			.addColumn('file_name', 'text')
			.addColumn('last_accessed', 'integer', (column) => column.notNull())
			.addColumn('ip_address', 'text', (column) => column.notNull())
			.addColumn('user_agent', 'text', (column) =>
				userAgentDefaultValue === "''"
					? column.notNull().defaultTo('')
					: column.notNull()
			)
			.addColumn('user_id', 'text', (column) =>
				userIdDefaultValue === "''"
					? column.notNull().defaultTo('')
					: column.notNull()
			)
			.execute();
		await sql`
			insert into ${nextTableName} (
				code,
				created_at,
				file_name,
				last_accessed,
				ip_address,
				user_agent,
				user_id
			)
			select
				code,
				created_at,
				file_name,
				last_accessed,
				ip_address,
				user_agent,
				user_id
			from ${backupFileTableName}
		`.execute(database);
	}
	const targetRowCount = await getRowCount(
		database,
		sql`select count(*) as count from ${nextTableName}`
	);
	if (targetRowCount !== sourceRowCount) {
		throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
	}

	await sql`drop table ${backupFileTableName}`.execute(database);
	await sql`
		alter table ${nextTableName}
		rename to ${backupFileTableName}
	`.execute(database);
}

async function rebuildBackupCodeLockTable(database: Kysely<TDatabase>) {
	const backupCodeLockTableName = sql.raw(TABLE_NAME_MAP.backupCodeLock);
	const nextTableName = sql.raw(BACKUP_CODE_LOCK_NEXT_TABLE_NAME);
	const sourceRowCount = await getRowCount(
		database,
		sql`
			select count(*) as count
			from ${backupCodeLockTableName}
			where code is not null
		`
	);
	await sql`
		create table ${nextTableName} (
			code text not null primary key,
			owner_id text not null,
			expires_at integer not null
		)
	`.execute(database);
	await sql`
		insert into ${nextTableName} (code, owner_id, expires_at)
		select code, owner_id, expires_at
		from ${backupCodeLockTableName}
		where code is not null
	`.execute(database);
	const targetRowCount = await getRowCount(
		database,
		sql`select count(*) as count from ${nextTableName}`
	);
	if (targetRowCount !== sourceRowCount) {
		throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
	}

	await sql`drop table ${backupCodeLockTableName}`.execute(database);
	await sql`
		alter table ${nextTableName}
		rename to ${backupCodeLockTableName}
	`.execute(database);
}

async function ensureBackupFileIndexes(database: Kysely<TDatabase>) {
	await dropMismatchedSqliteIndexes(database, BACKUP_FILE_INDEX_DEFINITIONS);

	await database.schema
		.createIndex('backup_files_ip_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.backupFileRecord)
		.columns(['ip_address', 'created_at'])
		.execute();

	await database.schema
		.createIndex('backup_files_ip_last_accessed_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.backupFileRecord)
		.columns(['ip_address', 'last_accessed'])
		.execute();

	await database.schema
		.createIndex('backup_files_last_accessed_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.backupFileRecord)
		.column('last_accessed')
		.execute();

	await database.schema
		.createIndex('backup_files_created_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.backupFileRecord)
		.column('created_at')
		.execute();

	await database.schema
		.createIndex('backup_files_ip_ua_user_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.backupFileRecord)
		.columns(['ip_address', 'user_agent', 'user_id', 'created_at'])
		.execute();
}

export async function migrateLegacyBackupTables(database: Kysely<TDatabase>) {
	await database.transaction().execute(async (transaction) => {
		await transaction.schema
			.createTable(TABLE_NAME_MAP.backupFileRecord)
			.ifNotExists()
			.addColumn('code', 'text', (col) => col.notNull().primaryKey())
			.addColumn('created_at', 'integer', (col) => col.notNull())
			.addColumn('file_name', 'text')
			.addColumn('last_accessed', 'integer', (col) => col.notNull())
			.addColumn('ip_address', 'text', (col) => col.notNull())
			.addColumn('user_agent', 'text', (col) => col.notNull())
			.addColumn('user_id', 'text', (col) => col.notNull())
			.execute();

		await transaction.schema
			.createTable(TABLE_NAME_MAP.backupCodeLock)
			.ifNotExists()
			.addColumn('code', 'text', (col) => col.notNull().primaryKey())
			.addColumn('owner_id', 'text', (col) => col.notNull())
			.addColumn('expires_at', 'integer', (col) => col.notNull())
			.execute();

		const backupFileTableName = sql.raw(TABLE_NAME_MAP.backupFileRecord);
		await sql`
			update ${backupFileTableName}
			set code = code
			where 0
		`.execute(transaction);

		if (
			(await checkTableExists(
				transaction,
				BACKUP_FILE_NEXT_TABLE_NAME
			)) ||
			(await checkTableExists(
				transaction,
				BACKUP_CODE_LOCK_NEXT_TABLE_NAME
			))
		) {
			throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
		}

		const initialBackupFileColumns = await getTableColumns(
			transaction,
			TABLE_NAME_MAP.backupFileRecord
		);
		if (
			BACKUP_FILE_STRUCTURAL_COLUMNS.some(
				(column) => !initialBackupFileColumns.includes(column)
			)
		) {
			throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
		}
		await addBackupFileRecordColumnIfMissing(
			transaction,
			initialBackupFileColumns,
			'file_name'
		);
		await addBackupFileRecordColumnIfMissing(
			transaction,
			initialBackupFileColumns,
			'user_agent'
		);
		await addBackupFileRecordColumnIfMissing(
			transaction,
			initialBackupFileColumns,
			'user_id'
		);

		const backupFileColumns = await getTableColumnInfo(
			transaction,
			TABLE_NAME_MAP.backupFileRecord
		);
		const legacyFilePathColumn = backupFileColumns.find(
			(column) => column.name === 'file_path'
		);
		const hasLegacyFilePathColumn = legacyFilePathColumn !== undefined;
		const backupFileExpectedColumns = hasLegacyFilePathColumn
			? legacyFilePathColumn.notNull
				? BACKUP_FILE_V160_SOURCE_COLUMNS
				: BACKUP_FILE_V160_TARGET_COLUMNS
			: BACKUP_FILE_COLUMNS;
		const isBackupFilePrimaryKeyNotNull = checkRequiredTableStructure(
			backupFileColumns,
			backupFileExpectedColumns,
			'code'
		);
		if (hasLegacyFilePathColumn && isBackupFilePrimaryKeyNotNull) {
			await checkRebuildShape(
				transaction,
				TABLE_NAME_MAP.backupFileRecord,
				backupFileColumns,
				BACKUP_FILE_V160_TARGET_COLUMNS,
				BACKUP_FILE_V160_TARGET_CREATE_TABLE_SHAPES,
				BACKUP_FILE_INDEX_DEFINITIONS.map(
					(definition) => definition.indexName
				)
			);
		} else if (!isBackupFilePrimaryKeyNotNull) {
			await checkRebuildShape(
				transaction,
				TABLE_NAME_MAP.backupFileRecord,
				backupFileColumns,
				backupFileExpectedColumns,
				hasLegacyFilePathColumn
					? BACKUP_FILE_V160_ACCEPTED_CREATE_TABLE_SHAPES
					: BACKUP_FILE_ACCEPTED_CREATE_TABLE_SHAPES,
				BACKUP_FILE_INDEX_DEFINITIONS.map(
					(definition) => definition.indexName
				)
			);
			await rebuildBackupFileTable(
				transaction,
				backupFileColumns,
				hasLegacyFilePathColumn
			);
		}

		const backupCodeLockColumns = await getTableColumnInfo(
			transaction,
			TABLE_NAME_MAP.backupCodeLock
		);
		const isBackupCodeLockPrimaryKeyNotNull = checkRequiredTableStructure(
			backupCodeLockColumns,
			BACKUP_CODE_LOCK_COLUMNS,
			'code'
		);
		if (!isBackupCodeLockPrimaryKeyNotNull) {
			await checkRebuildShape(
				transaction,
				TABLE_NAME_MAP.backupCodeLock,
				backupCodeLockColumns,
				BACKUP_CODE_LOCK_COLUMNS,
				BACKUP_CODE_LOCK_ACCEPTED_CREATE_TABLE_SHAPES,
				[]
			);
			await rebuildBackupCodeLockTable(transaction);
		}

		await ensureBackupFileIndexes(transaction);

		if (
			!checkRequiredTableStructure(
				await getTableColumnInfo(
					transaction,
					TABLE_NAME_MAP.backupFileRecord
				),
				hasLegacyFilePathColumn
					? BACKUP_FILE_V160_TARGET_COLUMNS
					: BACKUP_FILE_COLUMNS,
				'code'
			) ||
			!checkRequiredTableStructure(
				await getTableColumnInfo(
					transaction,
					TABLE_NAME_MAP.backupCodeLock
				),
				BACKUP_CODE_LOCK_COLUMNS,
				'code'
			)
		) {
			throw new Error(LEGACY_BACKUP_STRUCTURE_ERROR);
		}
	});
}
