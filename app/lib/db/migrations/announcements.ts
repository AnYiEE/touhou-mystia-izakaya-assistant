import { type ColumnDataType, type Kysely, sql } from 'kysely';

import { TABLE_NAME_MAP } from '../constant';
import { type TDatabase } from '../types';
import { dropMismatchedSqliteIndexes, getTableColumns } from '../utils';

const SERVER_MISCONFIGURED_MESSAGE = 'server-misconfigured';

type TAnnouncementTableName = keyof typeof ANNOUNCEMENT_TABLE_COLUMNS_MAP;

interface IColumnDefinition {
	dataType: ColumnDataType;
	defaultTo?: number | string;
	notNull?: boolean;
	structural?: boolean;
}

interface IPragmaForeignKeyRow {
	from: string;
	on_delete: string;
	table: string;
	to: string;
}

interface IPragmaIndexInfoRow {
	name: string;
	seqno: number;
}

interface IPragmaIndexListRow {
	name: string;
	unique: number;
}

interface IPragmaTableInfoRow {
	name: string;
	notnull: number;
	pk: number;
}

interface IPrimaryKeyColumnInfo {
	name: string;
	notNull: boolean;
}

const ANNOUNCEMENT_TABLE_COLUMNS_MAP = {
	[TABLE_NAME_MAP.announcement]: [
		'id',
		'title',
		'level',
		'audience',
		'html',
		'enabled',
		'dismissible',
		'priority',
		'starts_at',
		'ends_at',
		'target_user_ids_json',
		'revision',
		'created_at',
		'updated_at',
		'deleted_at',
	],
	[TABLE_NAME_MAP.announcementDismissal]: [
		'user_id',
		'announcement_id',
		'announcement_updated_at',
		'dismissed_at',
	],
	[TABLE_NAME_MAP.announcementVersion]: [
		'id',
		'announcement_id',
		'revision',
		'action',
		'snapshot_json',
		'changed_fields_json',
		'changed_by',
		'changed_at',
	],
} as const;

const ANNOUNCEMENT_TABLE_COLUMN_DEFINITION_MAP = {
	[TABLE_NAME_MAP.announcement]: {
		audience: { dataType: 'text', defaultTo: 'all', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		deleted_at: { dataType: 'integer' },
		dismissible: { dataType: 'integer', defaultTo: 1, notNull: true },
		enabled: { dataType: 'integer', defaultTo: 0, notNull: true },
		ends_at: { dataType: 'integer' },
		html: { dataType: 'text', structural: true },
		id: { dataType: 'text', structural: true },
		level: { dataType: 'text', defaultTo: 'info', notNull: true },
		priority: { dataType: 'integer', defaultTo: 0, notNull: true },
		revision: { dataType: 'integer', defaultTo: 1, notNull: true },
		starts_at: { dataType: 'integer' },
		target_user_ids_json: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		title: { dataType: 'text', defaultTo: '', notNull: true },
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
	},
	[TABLE_NAME_MAP.announcementDismissal]: {
		announcement_id: { dataType: 'text', structural: true },
		announcement_updated_at: { dataType: 'integer', structural: true },
		dismissed_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text', structural: true },
	},
	[TABLE_NAME_MAP.announcementVersion]: {
		action: { dataType: 'text', defaultTo: 'update', notNull: true },
		announcement_id: { dataType: 'text', structural: true },
		changed_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		changed_by: { dataType: 'text' },
		changed_fields_json: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		id: { dataType: 'integer', structural: true },
		revision: { dataType: 'integer', defaultTo: 1, notNull: true },
		snapshot_json: { dataType: 'text', defaultTo: '{}', notNull: true },
	},
} as const satisfies Record<
	keyof typeof ANNOUNCEMENT_TABLE_COLUMNS_MAP,
	Record<string, IColumnDefinition>
>;

function checkDuplicateColumnError(error: unknown) {
	return (
		error instanceof Error && /duplicate column name/iu.test(error.message)
	);
}

async function addMissingColumn(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName,
	columnName: string,
	definition: IColumnDefinition
) {
	try {
		await database.schema
			.alterTable(tableName)
			.addColumn(columnName, definition.dataType, (col) => {
				let builder = definition.notNull === true ? col.notNull() : col;

				if (definition.defaultTo !== undefined) {
					builder = builder.defaultTo(definition.defaultTo);
				}

				return builder;
			})
			.execute();
	} catch (error) {
		if (checkDuplicateColumnError(error)) {
			return;
		}

		throw error;
	}
}

async function ensureTableColumns(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName
) {
	const columns = await getTableColumns(database, tableName);
	const columnDefinitionMap = ANNOUNCEMENT_TABLE_COLUMN_DEFINITION_MAP[
		tableName
	] as Record<string, IColumnDefinition>;
	const missingColumns = ANNOUNCEMENT_TABLE_COLUMNS_MAP[tableName].filter(
		(column) => !columns.includes(column)
	);

	const structuralMissingColumns = missingColumns.filter(
		(column) => columnDefinitionMap[column]?.structural === true
	);

	if (structuralMissingColumns.length > 0) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName} is missing structural columns: ${structuralMissingColumns.join(', ')}`
		);
	}

	for (const column of missingColumns) {
		const definition = columnDefinitionMap[column];
		if (definition === undefined) {
			throw new Error(
				`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName} has no definition for column: ${column}`
			);
		}

		await addMissingColumn(database, tableName, column, definition);
	}

	const finalColumns = await getTableColumns(database, tableName);
	const stillMissingColumns = ANNOUNCEMENT_TABLE_COLUMNS_MAP[
		tableName
	].filter((column) => !finalColumns.includes(column));
	if (stillMissingColumns.length > 0) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName} is missing columns after migration: ${stillMissingColumns.join(', ')}`
		);
	}
}

async function getPrimaryKeyColumns(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName
) {
	const { rows } = await sql<IPragmaTableInfoRow>`
		select name, "notnull", pk
		from pragma_table_info(${tableName})
	`.execute(database);

	return rows
		.filter((row) => row.pk > 0)
		.sort((left, right) => left.pk - right.pk)
		.map((row) => ({ name: row.name, notNull: row.notnull === 1 }));
}

async function getForeignKeys(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName
) {
	const { rows } = await sql<IPragmaForeignKeyRow>`
		select "from", "table", "to", on_delete
		from pragma_foreign_key_list(${tableName})
	`.execute(database);

	return rows;
}

async function hasIndex(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName,
	columnNames: string[],
	unique = false
) {
	const { rows: indexes } = await sql<IPragmaIndexListRow>`
		select name, "unique"
		from pragma_index_list(${tableName})
	`.execute(database);

	for (const index of indexes) {
		if (unique && index.unique !== 1) {
			continue;
		}

		const { rows: columns } = await sql<IPragmaIndexInfoRow>`
			select name, seqno
			from pragma_index_info(${index.name})
		`.execute(database);
		const actualColumnNames = columns
			.sort((left, right) => left.seqno - right.seqno)
			.map((column) => column.name);

		if (
			actualColumnNames.length === columnNames.length &&
			actualColumnNames.every(
				(column, index_) => column === columnNames[index_]
			)
		) {
			return true;
		}
	}

	return false;
}

function assertPrimaryKeyColumns(
	tableName: TAnnouncementTableName,
	actualColumns: IPrimaryKeyColumnInfo[],
	expectedColumns: string[]
) {
	const actualColumnNames = actualColumns.map((column) => column.name);
	if (
		actualColumnNames.length !== expectedColumns.length ||
		actualColumnNames.some(
			(column, index) => column !== expectedColumns[index]
		)
	) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName} primary key must be ${expectedColumns.join(', ')}`
		);
	}

	const nullableColumn = actualColumns.find((column) => !column.notNull);
	if (nullableColumn !== undefined) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName} primary key column ${nullableColumn.name} must be not null`
		);
	}
}

async function assertCascadeForeignKey(
	database: Kysely<TDatabase>,
	tableName: TAnnouncementTableName,
	columnName: string,
	referencedTableName: string,
	referencedColumnName = 'id'
) {
	const foreignKeys = await getForeignKeys(database, tableName);
	const hasForeignKey = foreignKeys.some(
		(foreignKey) =>
			foreignKey.from === columnName &&
			foreignKey.table === referencedTableName &&
			foreignKey.to === referencedColumnName &&
			foreignKey.on_delete.toLowerCase() === 'cascade'
	);

	if (!hasForeignKey) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${tableName}.${columnName} must reference ${referencedTableName}(${referencedColumnName}) on delete cascade`
		);
	}
}

async function ensureAnnouncementTableStructure(database: Kysely<TDatabase>) {
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.announcement,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.announcement),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.announcementDismissal,
		await getPrimaryKeyColumns(
			database,
			TABLE_NAME_MAP.announcementDismissal
		),
		['user_id', 'announcement_id', 'announcement_updated_at']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.announcementVersion,
		await getPrimaryKeyColumns(
			database,
			TABLE_NAME_MAP.announcementVersion
		),
		['id']
	);

	await Promise.all([
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.announcementDismissal,
			'user_id',
			TABLE_NAME_MAP.user
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.announcementDismissal,
			'announcement_id',
			TABLE_NAME_MAP.announcement
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.announcementVersion,
			'announcement_id',
			TABLE_NAME_MAP.announcement
		),
	]);

	const requiredIndexes = [
		{
			columns: [
				'enabled',
				'deleted_at',
				'audience',
				'starts_at',
				'ends_at',
				'priority',
				'updated_at',
			],
			tableName: TABLE_NAME_MAP.announcement,
		},
		{ columns: ['updated_at'], tableName: TABLE_NAME_MAP.announcement },
		{ columns: ['id', 'revision'], tableName: TABLE_NAME_MAP.announcement },
		{
			columns: ['user_id', 'announcement_id', 'announcement_updated_at'],
			tableName: TABLE_NAME_MAP.announcementDismissal,
		},
		{
			columns: ['dismissed_at'],
			tableName: TABLE_NAME_MAP.announcementDismissal,
		},
		{
			columns: ['announcement_id', 'revision'],
			tableName: TABLE_NAME_MAP.announcementVersion,
			unique: true,
		},
		{
			columns: ['changed_at'],
			tableName: TABLE_NAME_MAP.announcementVersion,
		},
	] as const satisfies Array<{
		columns: string[];
		tableName: TAnnouncementTableName;
		unique?: boolean;
	}>;

	for (const index of requiredIndexes) {
		const isUniqueIndex = 'unique' in index ? index.unique : false;
		const hasRequiredIndex = await hasIndex(
			database,
			index.tableName,
			index.columns,
			isUniqueIndex
		);
		if (!hasRequiredIndex) {
			throw new Error(
				`${SERVER_MISCONFIGURED_MESSAGE}: announcement table ${index.tableName} must have a${isUniqueIndex ? ' unique' : 'n'} index on ${index.columns.join(', ')}`
			);
		}
	}
}

export async function migrateAnnouncementTables(database: Kysely<TDatabase>) {
	await database.schema
		.createTable(TABLE_NAME_MAP.announcement)
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('title', 'text', (col) => col.notNull())
		.addColumn('level', 'text', (col) => col.notNull().defaultTo('info'))
		.addColumn('audience', 'text', (col) => col.notNull().defaultTo('all'))
		.addColumn('html', 'text', (col) => col.notNull())
		.addColumn('enabled', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('dismissible', 'integer', (col) =>
			col.notNull().defaultTo(1)
		)
		.addColumn('priority', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('starts_at', 'integer')
		.addColumn('ends_at', 'integer')
		.addColumn('target_user_ids_json', 'text', (col) =>
			col.notNull().defaultTo('[]')
		)
		.addColumn('revision', 'integer', (col) => col.notNull().defaultTo(1))
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.addColumn('deleted_at', 'integer')
		.execute();

	const dismissalTableName = sql.raw(TABLE_NAME_MAP.announcementDismissal);
	const announcementTableName = sql.raw(TABLE_NAME_MAP.announcement);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);
	await sql`
		create table if not exists ${dismissalTableName} (
			user_id text not null references ${userTableName}(id) on delete cascade,
			announcement_id text not null references ${announcementTableName}(id) on delete cascade,
			announcement_updated_at integer not null,
			dismissed_at integer not null,
			primary key (user_id, announcement_id, announcement_updated_at)
		)
	`.execute(database);

	await database.schema
		.createTable(TABLE_NAME_MAP.announcementVersion)
		.ifNotExists()
		.addColumn('id', 'integer', (col) =>
			col.notNull().primaryKey().autoIncrement()
		)
		.addColumn('announcement_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.announcement}.id`)
				.onDelete('cascade')
		)
		.addColumn('revision', 'integer', (col) => col.notNull())
		.addColumn('action', 'text', (col) => col.notNull())
		.addColumn('snapshot_json', 'text', (col) => col.notNull())
		.addColumn('changed_fields_json', 'text', (col) => col.notNull())
		.addColumn('changed_by', 'text')
		.addColumn('changed_at', 'integer', (col) => col.notNull())
		.execute();

	for (const tableName of Object.keys(ANNOUNCEMENT_TABLE_COLUMNS_MAP)) {
		await ensureTableColumns(
			database,
			tableName as keyof typeof ANNOUNCEMENT_TABLE_COLUMNS_MAP
		);
	}

	await dropMismatchedSqliteIndexes(database, [
		{
			columns: [
				'enabled',
				'deleted_at',
				'audience',
				'starts_at',
				'ends_at',
				'priority',
				'updated_at',
			],
			indexName: 'announcements_active_index',
			tableName: TABLE_NAME_MAP.announcement,
		},
		{
			columns: ['updated_at'],
			indexName: 'announcements_updated_at_index',
			tableName: TABLE_NAME_MAP.announcement,
		},
		{
			columns: ['updated_at', 'created_at', 'id'],
			indexName: 'announcements_updated_created_id_index',
			tableName: TABLE_NAME_MAP.announcement,
		},
		{
			columns: ['id', 'revision'],
			indexName: 'announcements_revision_index',
			tableName: TABLE_NAME_MAP.announcement,
		},
		{
			columns: ['user_id', 'announcement_id', 'announcement_updated_at'],
			indexName: 'announcement_dismissals_user_index',
			tableName: TABLE_NAME_MAP.announcementDismissal,
		},
		{
			columns: ['dismissed_at'],
			indexName: 'announcement_dismissals_dismissed_index',
			tableName: TABLE_NAME_MAP.announcementDismissal,
		},
		{
			columns: ['announcement_id', 'revision'],
			indexName: 'announcement_versions_revision_unique_index',
			tableName: TABLE_NAME_MAP.announcementVersion,
			unique: true,
		},
		{
			columns: ['announcement_id', 'revision'],
			indexName: 'announcement_versions_list_index',
			tableName: TABLE_NAME_MAP.announcementVersion,
		},
		{
			columns: ['changed_at'],
			indexName: 'announcement_versions_changed_index',
			tableName: TABLE_NAME_MAP.announcementVersion,
		},
		{
			columns: ['announcement_id', 'revision', 'changed_at', 'id'],
			indexName: 'announcement_versions_cleanup_index',
			tableName: TABLE_NAME_MAP.announcementVersion,
		},
	]);

	await database.schema
		.createIndex('announcements_active_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcement)
		.columns([
			'enabled',
			'deleted_at',
			'audience',
			'starts_at',
			'ends_at',
			'priority',
			'updated_at',
		])
		.execute();

	await database.schema
		.createIndex('announcements_updated_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcement)
		.column('updated_at')
		.execute();

	await database.schema
		.createIndex('announcements_updated_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcement)
		.columns(['updated_at', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('announcements_revision_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcement)
		.columns(['id', 'revision'])
		.execute();

	await database.schema
		.createIndex('announcement_dismissals_user_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementDismissal)
		.columns(['user_id', 'announcement_id', 'announcement_updated_at'])
		.execute();

	await database.schema
		.createIndex('announcement_dismissals_dismissed_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementDismissal)
		.column('dismissed_at')
		.execute();

	await database.schema
		.createIndex('announcement_versions_revision_unique_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementVersion)
		.columns(['announcement_id', 'revision'])
		.unique()
		.execute();

	await database.schema
		.createIndex('announcement_versions_list_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementVersion)
		.columns(['announcement_id', 'revision'])
		.execute();

	await database.schema
		.createIndex('announcement_versions_changed_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementVersion)
		.column('changed_at')
		.execute();

	await database.schema
		.createIndex('announcement_versions_cleanup_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.announcementVersion)
		.columns(['announcement_id', 'revision', 'changed_at', 'id'])
		.execute();

	await ensureAnnouncementTableStructure(database);
}
