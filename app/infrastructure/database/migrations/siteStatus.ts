import { type Kysely, sql } from 'kysely';

import type { TDatabase } from '@/infrastructure/database/schema';
import {
	type ISqliteAcceptedCreateTableShape,
	checkSqliteCreateTableShapeAccepted,
} from '@/infrastructure/database/sqlite/tableDefinition';
import {
	type ISqliteTableColumnInfo,
	getCreateTableSql,
	getForeignKeys,
	getTableColumnInfo,
	getTableSchemaObjects,
} from '@/infrastructure/database/sqlite/tableIntrospection';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

const NEXT_TABLE_NAME = '__migration_site_runtime_states_next';
const SITE_RUNTIME_STATE_COLUMNS = {
	expires_at: { notNull: true, primaryKeyOrdinal: 0, type: 'integer' },
	key: { notNull: true, primaryKeyOrdinal: 1, type: 'text' },
	operation_id: { notNull: true, primaryKeyOrdinal: 0, type: 'text' },
	started_at: { notNull: true, primaryKeyOrdinal: 0, type: 'integer' },
} as const;
const SITE_RUNTIME_STATE_ACCEPTED_CREATE_TABLE_SHAPES = [
	{
		columns: [
			{ constraint: 'primary key', name: 'key', type: 'text' },
			{ constraint: 'not null', name: 'operation_id', type: 'text' },
			{ constraint: 'not null', name: 'started_at', type: 'integer' },
			{ constraint: 'not null', name: 'expires_at', type: 'integer' },
		],
		tableName: TABLE_NAME_MAP.siteRuntimeState,
	},
] as const satisfies ReadonlyArray<ISqliteAcceptedCreateTableShape>;

function getKeyColumn(columns: ISqliteTableColumnInfo[]) {
	const missingColumns = Object.keys(SITE_RUNTIME_STATE_COLUMNS).filter(
		(name) => !columns.some((column) => column.name === name)
	);
	if (missingColumns.length > 0) {
		throw new Error('server-misconfigured: site-runtime-state-columns');
	}

	const keyColumn = columns.find((column) => column.name === 'key');
	const primaryKeyColumns = columns.filter(
		(column) => column.primaryKeyOrdinal > 0
	);
	const [primaryKeyColumn] = primaryKeyColumns;
	const hasRequiredStructure = Object.entries(
		SITE_RUNTIME_STATE_COLUMNS
	).every(([name, expected]) => {
		const column = columns.find((candidate) => candidate.name === name);
		return (
			column?.type === expected.type &&
			column.defaultValue === null &&
			column.hidden === 0 &&
			column.primaryKeyOrdinal === expected.primaryKeyOrdinal &&
			(name === 'key' || column.notNull === expected.notNull)
		);
	});
	if (
		!hasRequiredStructure ||
		keyColumn === undefined ||
		primaryKeyColumns.length !== 1 ||
		primaryKeyColumn?.name !== 'key' ||
		primaryKeyColumn.primaryKeyOrdinal !== 1
	) {
		throw new Error('server-misconfigured: site-runtime-state-structure');
	}

	return keyColumn;
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
		throw new TypeError(
			'server-misconfigured: site-runtime-state-structure'
		);
	}

	return count;
}

async function rebuildSiteRuntimeStateTable(database: Kysely<TDatabase>) {
	const columns = await getTableColumnInfo(
		database,
		TABLE_NAME_MAP.siteRuntimeState
	);
	const expectedColumnNames = Object.keys(SITE_RUNTIME_STATE_COLUMNS);
	const [createTableSql, foreignKeys, schemaObjects] = await Promise.all([
		getCreateTableSql(database, TABLE_NAME_MAP.siteRuntimeState),
		getForeignKeys(database, TABLE_NAME_MAP.siteRuntimeState),
		getTableSchemaObjects(database, TABLE_NAME_MAP.siteRuntimeState),
	]);
	if (
		columns.length !== expectedColumnNames.length ||
		columns.some((column) => !expectedColumnNames.includes(column.name)) ||
		createTableSql === null ||
		!checkSqliteCreateTableShapeAccepted(
			createTableSql,
			SITE_RUNTIME_STATE_ACCEPTED_CREATE_TABLE_SHAPES
		) ||
		foreignKeys.length > 0 ||
		schemaObjects.length > 0
	) {
		throw new Error('server-misconfigured: site-runtime-state-structure');
	}

	const tableName = sql.raw(TABLE_NAME_MAP.siteRuntimeState);
	const nextTableName = sql.raw(NEXT_TABLE_NAME);
	const sourceRowCount = await getRowCount(
		database,
		sql`
			select count(*) as count
			from ${tableName}
			where key is not null
		`
	);
	await sql`
		create table ${nextTableName} (
			key text not null primary key,
			operation_id text not null,
			started_at integer not null,
			expires_at integer not null
		)
	`.execute(database);
	await sql`
		insert into ${nextTableName} (
			key,
			operation_id,
			started_at,
			expires_at
		)
		select key, operation_id, started_at, expires_at
		from ${tableName}
		where key is not null
	`.execute(database);
	const targetRowCount = await getRowCount(
		database,
		sql`select count(*) as count from ${nextTableName}`
	);
	if (targetRowCount !== sourceRowCount) {
		throw new Error('server-misconfigured: site-runtime-state-structure');
	}

	await sql`drop table ${tableName}`.execute(database);
	await sql`
		alter table ${nextTableName}
		rename to ${tableName}
	`.execute(database);
}

export async function migrateSiteRuntimeStateTable(
	database: Kysely<TDatabase>
) {
	await database.transaction().execute(async (transaction) => {
		await transaction.schema
			.createTable(TABLE_NAME_MAP.siteRuntimeState)
			.ifNotExists()
			.addColumn('key', 'text', (column) => column.notNull().primaryKey())
			.addColumn('operation_id', 'text', (column) => column.notNull())
			.addColumn('started_at', 'integer', (column) => column.notNull())
			.addColumn('expires_at', 'integer', (column) => column.notNull())
			.execute();

		const tableName = sql.raw(TABLE_NAME_MAP.siteRuntimeState);
		await sql`
			update ${tableName}
			set key = key
			where 0
		`.execute(transaction);

		if (await checkTableExists(transaction, NEXT_TABLE_NAME)) {
			throw new Error(
				'server-misconfigured: site-runtime-state-structure'
			);
		}

		const initialColumns = await getTableColumnInfo(
			transaction,
			TABLE_NAME_MAP.siteRuntimeState
		);
		const keyColumn = getKeyColumn(initialColumns);
		if (!keyColumn.notNull) {
			await rebuildSiteRuntimeStateTable(transaction);
		}

		const finalKeyColumn = getKeyColumn(
			await getTableColumnInfo(
				transaction,
				TABLE_NAME_MAP.siteRuntimeState
			)
		);
		if (!finalKeyColumn.notNull) {
			throw new Error(
				'server-misconfigured: site-runtime-state-structure'
			);
		}
	});
}
