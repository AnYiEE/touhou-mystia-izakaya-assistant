import { type ColumnDataType, type Kysely, sql } from 'kysely';

import { TABLE_NAME_MAP } from '../constant';
import { type TDatabase } from '../types';
import { getTableColumns } from '../utils';

const SERVER_MISCONFIGURED_MESSAGE = 'server-misconfigured';

type TSsoTableName = keyof typeof SSO_TABLE_COLUMNS_MAP;

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

interface ISqliteMasterTableRow {
	sql: string | null;
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

const SSO_TABLE_COLUMNS_MAP = {
	[TABLE_NAME_MAP.ssoCallbackQueue]: [
		'id',
		'client_id',
		'user_id',
		'event',
		'timestamp',
		'attempts',
		'last_error',
		'next_retry_at',
		'created_at',
	],
	[TABLE_NAME_MAP.ssoClient]: [
		'id',
		'name',
		'secret_hashes',
		'loopback_redirect_paths',
		'custom_scheme_redirect_uris',
		'https_redirect_uris',
		'status_callback_url',
		'cancel_redirect_uri',
		'created_at',
		'updated_at',
	],
	[TABLE_NAME_MAP.ssoTicket]: [
		'ticket_hash',
		'client_id',
		'user_id',
		'redirect_uri',
		'code_challenge',
		'created_at',
		'expires_at',
		'used_at',
	],
	[TABLE_NAME_MAP.ssoUserClientGrant]: [
		'client_id',
		'user_id',
		'created_at',
		'updated_at',
	],
} as const;

const SSO_TABLE_COLUMN_DEFINITION_MAP = {
	[TABLE_NAME_MAP.ssoCallbackQueue]: {
		attempts: { dataType: 'integer', defaultTo: 0, notNull: true },
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		event: { dataType: 'text', defaultTo: '', notNull: true },
		id: { dataType: 'integer', structural: true },
		last_error: { dataType: 'text' },
		next_retry_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		timestamp: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text', defaultTo: '', notNull: true },
	},
	[TABLE_NAME_MAP.ssoClient]: {
		cancel_redirect_uri: { dataType: 'text' },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		custom_scheme_redirect_uris: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		https_redirect_uris: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		id: { dataType: 'text', structural: true },
		loopback_redirect_paths: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		name: { dataType: 'text', defaultTo: '', notNull: true },
		secret_hashes: { dataType: 'text', defaultTo: '[]', notNull: true },
		status_callback_url: { dataType: 'text' },
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
	},
	[TABLE_NAME_MAP.ssoTicket]: {
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		code_challenge: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		expires_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		redirect_uri: { dataType: 'text', defaultTo: '', notNull: true },
		ticket_hash: { dataType: 'text', structural: true },
		used_at: { dataType: 'integer' },
		user_id: { dataType: 'text', structural: true },
	},
	[TABLE_NAME_MAP.ssoUserClientGrant]: {
		client_id: { dataType: 'text', structural: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text', structural: true },
	},
} as const satisfies Record<
	keyof typeof SSO_TABLE_COLUMNS_MAP,
	Record<string, IColumnDefinition>
>;

function checkDuplicateColumnError(error: unknown) {
	return (
		error instanceof Error && /duplicate column name/iu.test(error.message)
	);
}

async function addMissingColumn(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
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
	tableName: TSsoTableName
) {
	const columns = await getTableColumns(database, tableName);
	const columnDefinitionMap = SSO_TABLE_COLUMN_DEFINITION_MAP[
		tableName
	] as Record<string, IColumnDefinition>;
	const missingColumns = SSO_TABLE_COLUMNS_MAP[tableName].filter(
		(column) => !columns.includes(column)
	);

	const structuralMissingColumns = missingColumns.filter(
		(column) => columnDefinitionMap[column]?.structural === true
	);

	if (structuralMissingColumns.length > 0) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName} is missing structural columns: ${structuralMissingColumns.join(', ')}`
		);
	}

	for (const column of missingColumns) {
		const definition = columnDefinitionMap[column];
		if (definition === undefined) {
			throw new Error(
				`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName} has no definition for column: ${column}`
			);
		}

		await addMissingColumn(database, tableName, column, definition);
	}

	const finalColumns = await getTableColumns(database, tableName);
	const stillMissingColumns = SSO_TABLE_COLUMNS_MAP[tableName].filter(
		(column) => !finalColumns.includes(column)
	);
	if (stillMissingColumns.length > 0) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName} is missing columns after migration: ${stillMissingColumns.join(', ')}`
		);
	}
}

async function getPrimaryKeyColumns(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName
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
	tableName: TSsoTableName
) {
	const { rows } = await sql<IPragmaForeignKeyRow>`
		select "from", "table", "to", on_delete
		from pragma_foreign_key_list(${tableName})
	`.execute(database);

	return rows;
}

async function getCreateTableSql(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName
) {
	const row = await sql<ISqliteMasterTableRow>`
		select sql
		from sqlite_master
		where type = 'table' and name = ${tableName}
	`.execute(database);

	return row.rows[0]?.sql ?? '';
}

async function hasCascadeForeignKey(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
	columnName: string,
	referencedTableName: string
) {
	const foreignKeys = await getForeignKeys(database, tableName);

	return foreignKeys.some(
		(foreignKey) =>
			foreignKey.from === columnName &&
			foreignKey.table === referencedTableName &&
			foreignKey.to === 'id' &&
			foreignKey.on_delete.toLowerCase() === 'cascade'
	);
}

async function hasCallbackEventCheck(database: Kysely<TDatabase>) {
	const createTableSql = await getCreateTableSql(
		database,
		TABLE_NAME_MAP.ssoCallbackQueue
	);
	const normalizedSql = createTableSql.replaceAll(/\s+/gu, ' ').toLowerCase();

	return (
		normalizedSql.includes("event in ('user_deleted', 'user_disabled')") ||
		normalizedSql.includes("event in ('user_deleted','user_disabled')")
	);
}

async function hasUniqueIndex(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
	columnNames: string[]
) {
	const { rows: indexes } = await sql<IPragmaIndexListRow>`
		select name, "unique"
		from pragma_index_list(${tableName})
	`.execute(database);

	for (const index of indexes) {
		if (index.unique !== 1) {
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
	tableName: TSsoTableName,
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
			`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName} primary key must be ${expectedColumns.join(', ')}`
		);
	}

	const nullableColumn = actualColumns.find((column) => !column.notNull);
	if (nullableColumn !== undefined) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName} primary key column ${nullableColumn.name} must be not null`
		);
	}
}

async function assertCascadeForeignKey(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
	columnName: string,
	referencedTableName: string
) {
	if (
		!(await hasCascadeForeignKey(
			database,
			tableName,
			columnName,
			referencedTableName
		))
	) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso table ${tableName}.${columnName} must reference ${referencedTableName}(id) on delete cascade`
		);
	}
}

async function rebuildSsoTicketTable(database: Kysely<TDatabase>) {
	const oldTableName = sql.raw(TABLE_NAME_MAP.ssoTicket);
	const nextTableName = sql.raw(`${TABLE_NAME_MAP.ssoTicket}_next`);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);

	await database.transaction().execute(async (transaction) => {
		await sql`drop table if exists ${nextTableName}`.execute(transaction);
		await sql`
			create table ${nextTableName} (
				ticket_hash text not null primary key,
				client_id text not null references ${clientTableName}(id) on delete cascade,
				user_id text not null references ${userTableName}(id) on delete cascade,
				redirect_uri text not null,
				code_challenge text not null,
				created_at integer not null,
				expires_at integer not null,
				used_at integer
			)
		`.execute(transaction);
		await sql`
			insert into ${nextTableName} (
				ticket_hash,
				client_id,
				user_id,
				redirect_uri,
				code_challenge,
				created_at,
				expires_at,
				used_at
			)
			select
				ticket_hash,
				client_id,
				user_id,
				redirect_uri,
				code_challenge,
				created_at,
				expires_at,
				used_at
			from ${oldTableName}
			where exists (
				select 1 from ${clientTableName}
				where ${clientTableName}.id = ${oldTableName}.client_id
			) and exists (
				select 1 from ${userTableName}
				where ${userTableName}.id = ${oldTableName}.user_id
			)
		`.execute(transaction);
		await sql`drop table ${oldTableName}`.execute(transaction);
		await sql`alter table ${nextTableName} rename to ${oldTableName}`.execute(
			transaction
		);
	});
}

async function rebuildSsoCallbackQueueTable(database: Kysely<TDatabase>) {
	const oldTableName = sql.raw(TABLE_NAME_MAP.ssoCallbackQueue);
	const nextTableName = sql.raw(`${TABLE_NAME_MAP.ssoCallbackQueue}_next`);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);

	await database.transaction().execute(async (transaction) => {
		await sql`drop table if exists ${nextTableName}`.execute(transaction);
		await sql`
			create table ${nextTableName} (
				id integer not null primary key autoincrement,
				client_id text not null references ${clientTableName}(id) on delete cascade,
				user_id text not null references ${userTableName}(id) on delete cascade,
				event text not null check(event in ('user_deleted', 'user_disabled')),
				timestamp integer not null,
				attempts integer not null default 0,
				last_error text,
				next_retry_at integer not null,
				created_at integer not null
			)
		`.execute(transaction);
		await sql`
			insert into ${nextTableName} (
				id,
				client_id,
				user_id,
				event,
				timestamp,
				attempts,
				last_error,
				next_retry_at,
				created_at
			)
			select
				id,
				client_id,
				user_id,
				event,
				timestamp,
				attempts,
				last_error,
				next_retry_at,
				created_at
			from ${oldTableName}
			where event in ('user_deleted', 'user_disabled')
				and exists (
					select 1 from ${clientTableName}
					where ${clientTableName}.id = ${oldTableName}.client_id
				)
				and exists (
					select 1 from ${userTableName}
					where ${userTableName}.id = ${oldTableName}.user_id
				)
				and id in (
					select max(id)
					from ${oldTableName}
					where event in ('user_deleted', 'user_disabled')
					group by client_id, user_id, event
				)
		`.execute(transaction);
		await sql`drop table ${oldTableName}`.execute(transaction);
		await sql`alter table ${nextTableName} rename to ${oldTableName}`.execute(
			transaction
		);
	});
}

async function rebuildSsoUserClientGrantTable(database: Kysely<TDatabase>) {
	const oldTableName = sql.raw(TABLE_NAME_MAP.ssoUserClientGrant);
	const nextTableName = sql.raw(`${TABLE_NAME_MAP.ssoUserClientGrant}_next`);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);

	await database.transaction().execute(async (transaction) => {
		await sql`drop table if exists ${nextTableName}`.execute(transaction);
		await sql`
			create table ${nextTableName} (
				client_id text not null references ${clientTableName}(id) on delete cascade,
				user_id text not null references ${userTableName}(id) on delete cascade,
				created_at integer not null,
				updated_at integer not null,
				primary key (client_id, user_id)
			)
		`.execute(transaction);
		await sql`
			insert into ${nextTableName} (
				client_id,
				user_id,
				created_at,
				updated_at
			)
			select
				client_id,
				user_id,
				min(created_at),
				max(updated_at)
			from ${oldTableName}
			where exists (
				select 1 from ${clientTableName}
				where ${clientTableName}.id = ${oldTableName}.client_id
			) and exists (
				select 1 from ${userTableName}
				where ${userTableName}.id = ${oldTableName}.user_id
			)
			group by client_id, user_id
		`.execute(transaction);
		await sql`drop table ${oldTableName}`.execute(transaction);
		await sql`alter table ${nextTableName} rename to ${oldTableName}`.execute(
			transaction
		);
	});
}

async function rebuildSsoTablesIfNeeded(database: Kysely<TDatabase>) {
	const needsTicketRebuild =
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoTicket,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		)) ||
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoTicket,
			'user_id',
			TABLE_NAME_MAP.user
		));
	if (needsTicketRebuild) {
		await rebuildSsoTicketTable(database);
	}

	const needsCallbackRebuild =
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		)) ||
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			'user_id',
			TABLE_NAME_MAP.user
		)) ||
		!(await hasCallbackEventCheck(database)) ||
		!(await hasUniqueIndex(database, TABLE_NAME_MAP.ssoCallbackQueue, [
			'client_id',
			'user_id',
			'event',
		]));
	if (needsCallbackRebuild) {
		await rebuildSsoCallbackQueueTable(database);
	}

	const needsGrantRebuild =
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoUserClientGrant,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		)) ||
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoUserClientGrant,
			'user_id',
			TABLE_NAME_MAP.user
		)) ||
		!(await hasUniqueIndex(database, TABLE_NAME_MAP.ssoUserClientGrant, [
			'client_id',
			'user_id',
		]));
	if (needsGrantRebuild) {
		await rebuildSsoUserClientGrantTable(database);
	}
}

async function ensureSsoTableStructure(database: Kysely<TDatabase>) {
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoTicket,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoTicket),
		['ticket_hash']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoClient,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoClient),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoCallbackQueue,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoCallbackQueue),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoUserClientGrant,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoUserClientGrant),
		['client_id', 'user_id']
	);

	await Promise.all([
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoTicket,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoTicket,
			'user_id',
			TABLE_NAME_MAP.user
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			'user_id',
			TABLE_NAME_MAP.user
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoUserClientGrant,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoUserClientGrant,
			'user_id',
			TABLE_NAME_MAP.user
		),
	]);

	const hasCallbackUniqueIndex = await hasUniqueIndex(
		database,
		TABLE_NAME_MAP.ssoCallbackQueue,
		['client_id', 'user_id', 'event']
	);
	if (!hasCallbackUniqueIndex) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso_callback_queue must have a unique index on client_id, user_id, event`
		);
	}
}

export async function migrateSsoTables(database: Kysely<TDatabase>) {
	await database.schema
		.createTable(TABLE_NAME_MAP.ssoClient)
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('secret_hashes', 'text', (col) => col.notNull())
		.addColumn('loopback_redirect_paths', 'text', (col) =>
			col.notNull().defaultTo('[]')
		)
		.addColumn('custom_scheme_redirect_uris', 'text', (col) =>
			col.notNull().defaultTo('[]')
		)
		.addColumn('https_redirect_uris', 'text', (col) =>
			col.notNull().defaultTo('[]')
		)
		.addColumn('status_callback_url', 'text')
		.addColumn('cancel_redirect_uri', 'text')
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.ssoTicket)
		.ifNotExists()
		.addColumn('ticket_hash', 'text', (col) => col.notNull().primaryKey())
		.addColumn('client_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.ssoClient}.id`)
				.onDelete('cascade')
		)
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('redirect_uri', 'text', (col) => col.notNull())
		.addColumn('code_challenge', 'text', (col) => col.notNull())
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('expires_at', 'integer', (col) => col.notNull())
		.addColumn('used_at', 'integer')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.ssoCallbackQueue)
		.ifNotExists()
		.addColumn('id', 'integer', (col) =>
			col.notNull().primaryKey().autoIncrement()
		)
		.addColumn('client_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.ssoClient}.id`)
				.onDelete('cascade')
		)
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('event', 'text', (col) =>
			col.notNull().check(sql`event in ('user_deleted', 'user_disabled')`)
		)
		.addColumn('timestamp', 'integer', (col) => col.notNull())
		.addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('last_error', 'text')
		.addColumn('next_retry_at', 'integer', (col) => col.notNull())
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.execute();

	const grantTableName = sql.raw(TABLE_NAME_MAP.ssoUserClientGrant);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);
	await sql`
		create table if not exists ${grantTableName} (
			client_id text not null references ${clientTableName}(id) on delete cascade,
			user_id text not null references ${userTableName}(id) on delete cascade,
			created_at integer not null,
			updated_at integer not null,
			primary key (client_id, user_id)
		)
	`.execute(database);

	for (const tableName of Object.keys(SSO_TABLE_COLUMNS_MAP)) {
		await ensureTableColumns(
			database,
			tableName as keyof typeof SSO_TABLE_COLUMNS_MAP
		);
	}

	await rebuildSsoTablesIfNeeded(database);

	await database.schema
		.createIndex('sso_tickets_expires_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.column('expires_at')
		.execute();

	await database.schema
		.createIndex('sso_tickets_user_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.column('user_id')
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_next_retry_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.column('next_retry_at')
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_client_user_event_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.columns(['client_id', 'user_id', 'event'])
		.execute();

	await database.schema
		.createIndex('sso_user_client_grants_user_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoUserClientGrant)
		.column('user_id')
		.execute();

	await ensureSsoTableStructure(database);
}
