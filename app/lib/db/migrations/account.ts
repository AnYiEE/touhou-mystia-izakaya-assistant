import { type ColumnDataType, type Kysely, sql } from 'kysely';

import { TABLE_NAME_MAP } from '../constant';
import { type TDatabase } from '../types';
import { getTableColumns } from '../utils';

const SERVER_MISCONFIGURED_MESSAGE = 'server-misconfigured';

type TAccountTableName = keyof typeof ACCOUNT_TABLE_COLUMNS_MAP;

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
}

interface IPragmaIndexInfoRow {
	name: string;
}

interface IPragmaIndexListRow {
	name: string;
	unique: number;
}

interface IPragmaTableInfoRow {
	name: string;
	pk: number;
}

const ACCOUNT_TABLE_COLUMNS_MAP = {
	[TABLE_NAME_MAP.session]: [
		'id',
		'user_id',
		'token_hash',
		'created_at',
		'last_seen_at',
		'user_agent',
		'ip_address',
	],
	[TABLE_NAME_MAP.user]: [
		'id',
		'username',
		'username_normalized',
		'status',
		'state_epoch',
		'created_at',
		'updated_at',
		'last_login_at',
		'deleted_at',
	],
	[TABLE_NAME_MAP.userCredential]: [
		'user_id',
		'password_hash',
		'failed_attempts',
		'locked_until',
		'password_must_change',
		'updated_at',
	],
	[TABLE_NAME_MAP.userState]: [
		'user_id',
		'namespace',
		'schema_version',
		'data',
		'revision',
		'updated_at',
	],
} as const;

const ACCOUNT_TABLE_COLUMN_DEFINITION_MAP = {
	[TABLE_NAME_MAP.session]: {
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		id: { dataType: 'text', structural: true },
		ip_address: { dataType: 'text', defaultTo: '', notNull: true },
		last_seen_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		token_hash: { dataType: 'text', defaultTo: '', notNull: true },
		user_agent: { dataType: 'text', defaultTo: '', notNull: true },
		user_id: { dataType: 'text', structural: true },
	},
	[TABLE_NAME_MAP.user]: {
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		deleted_at: { dataType: 'integer' },
		id: { dataType: 'text', structural: true },
		last_login_at: { dataType: 'integer' },
		state_epoch: { dataType: 'integer', defaultTo: 0, notNull: true },
		status: { dataType: 'text', defaultTo: 'active', notNull: true },
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		username: { dataType: 'text', defaultTo: '', notNull: true },
		username_normalized: { dataType: 'text', defaultTo: '', notNull: true },
	},
	[TABLE_NAME_MAP.userCredential]: {
		failed_attempts: { dataType: 'integer', defaultTo: 0, notNull: true },
		locked_until: { dataType: 'integer' },
		password_hash: { dataType: 'text', defaultTo: '', notNull: true },
		password_must_change: {
			dataType: 'integer',
			defaultTo: 0,
			notNull: true,
		},
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text', structural: true },
	},
	[TABLE_NAME_MAP.userState]: {
		data: { dataType: 'text', defaultTo: '{}', notNull: true },
		namespace: { dataType: 'text', structural: true },
		revision: { dataType: 'integer', defaultTo: 0, notNull: true },
		schema_version: { dataType: 'integer', defaultTo: 1, notNull: true },
		updated_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text', structural: true },
	},
} as const satisfies Record<
	keyof typeof ACCOUNT_TABLE_COLUMNS_MAP,
	Record<string, IColumnDefinition>
>;

async function addMissingColumn(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName,
	columnName: string,
	definition: IColumnDefinition
) {
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
}

async function ensureTableColumns(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName
) {
	const columns = await getTableColumns(database, tableName);
	const columnDefinitionMap = ACCOUNT_TABLE_COLUMN_DEFINITION_MAP[
		tableName
	] as Record<string, IColumnDefinition>;
	const missingColumns = ACCOUNT_TABLE_COLUMNS_MAP[tableName].filter(
		(column) => !columns.includes(column)
	);

	const structuralMissingColumns = missingColumns.filter(
		(column) => columnDefinitionMap[column]?.structural === true
	);

	if (structuralMissingColumns.length > 0) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: account table ${tableName} is missing structural columns: ${structuralMissingColumns.join(', ')}`
		);
	}

	for (const column of missingColumns) {
		const definition = columnDefinitionMap[column];
		if (definition === undefined) {
			throw new Error(
				`${SERVER_MISCONFIGURED_MESSAGE}: account table ${tableName} has no definition for column: ${column}`
			);
		}

		await addMissingColumn(database, tableName, column, definition);
	}
}

async function getPrimaryKeyColumns(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName
) {
	const { rows } = await sql<IPragmaTableInfoRow>`
		select name, pk
		from pragma_table_info(${tableName})
	`.execute(database);

	return rows
		.filter((row) => row.pk > 0)
		.sort((left, right) => left.pk - right.pk)
		.map((row) => row.name);
}

async function getForeignKeys(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName
) {
	const { rows } = await sql<IPragmaForeignKeyRow>`
		select "from", "table", on_delete
		from pragma_foreign_key_list(${tableName})
	`.execute(database);

	return rows;
}

async function hasUniqueIndex(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName,
	columnName: string
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
			select name
			from pragma_index_info(${index.name})
		`.execute(database);

		if (columns.length === 1 && columns[0]?.name === columnName) {
			return true;
		}
	}

	return false;
}

function assertPrimaryKeyColumns(
	tableName: TAccountTableName,
	actualColumns: string[],
	expectedColumns: string[]
) {
	if (
		actualColumns.length !== expectedColumns.length ||
		actualColumns.some((column, index) => column !== expectedColumns[index])
	) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: account table ${tableName} primary key must be ${expectedColumns.join(', ')}`
		);
	}
}

async function assertForeignKeyToUsers(
	database: Kysely<TDatabase>,
	tableName: TAccountTableName
) {
	const foreignKeys = await getForeignKeys(database, tableName);
	const hasUserCascadeForeignKey = foreignKeys.some(
		(foreignKey) =>
			foreignKey.from === 'user_id' &&
			foreignKey.table === TABLE_NAME_MAP.user &&
			foreignKey.on_delete.toLowerCase() === 'cascade'
	);

	if (!hasUserCascadeForeignKey) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: account table ${tableName} must reference users(id) on delete cascade`
		);
	}
}

async function ensureAccountTableStructure(database: Kysely<TDatabase>) {
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.user,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.user),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.userCredential,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.userCredential),
		['user_id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.session,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.session),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.userState,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.userState),
		['user_id', 'namespace']
	);

	await Promise.all([
		assertForeignKeyToUsers(database, TABLE_NAME_MAP.userCredential),
		assertForeignKeyToUsers(database, TABLE_NAME_MAP.session),
		assertForeignKeyToUsers(database, TABLE_NAME_MAP.userState),
	]);

	const hasUsernameUniqueIndex = await hasUniqueIndex(
		database,
		TABLE_NAME_MAP.user,
		'username_normalized'
	);
	const hasSessionTokenUniqueIndex = await hasUniqueIndex(
		database,
		TABLE_NAME_MAP.session,
		'token_hash'
	);

	if (!hasUsernameUniqueIndex) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: users.username_normalized must have a unique index`
		);
	}

	if (!hasSessionTokenUniqueIndex) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sessions.token_hash must have a unique index`
		);
	}
}

export async function migrateAccountTables(database: Kysely<TDatabase>) {
	await database.schema
		.createTable(TABLE_NAME_MAP.user)
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('username', 'text', (col) => col.notNull())
		.addColumn('username_normalized', 'text', (col) => col.notNull())
		.addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
		.addColumn('state_epoch', 'integer', (col) =>
			col.notNull().defaultTo(0)
		)
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.addColumn('last_login_at', 'integer')
		.addColumn('deleted_at', 'integer')
		.execute();

	await database.schema
		.createIndex('users_username_normalized_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.user)
		.column('username_normalized')
		.execute();

	await database.schema
		.createIndex('users_status_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.user)
		.column('status')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.userCredential)
		.ifNotExists()
		.addColumn('user_id', 'text', (col) =>
			col
				.primaryKey()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('password_hash', 'text', (col) => col.notNull())
		.addColumn('failed_attempts', 'integer', (col) =>
			col.notNull().defaultTo(0)
		)
		.addColumn('locked_until', 'integer')
		.addColumn('password_must_change', 'integer', (col) =>
			col.notNull().defaultTo(0)
		)
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.session)
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey())
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('token_hash', 'text', (col) => col.notNull())
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.addColumn('last_seen_at', 'integer', (col) => col.notNull())
		.addColumn('user_agent', 'text', (col) => col.notNull().defaultTo(''))
		.addColumn('ip_address', 'text', (col) => col.notNull().defaultTo(''))
		.execute();

	await database.schema
		.createIndex('sessions_token_hash_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.session)
		.column('token_hash')
		.execute();

	await database.schema
		.createIndex('sessions_user_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.session)
		.column('user_id')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.userState)
		.ifNotExists()
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('namespace', 'text', (col) => col.notNull())
		.addColumn('schema_version', 'integer', (col) =>
			col.notNull().defaultTo(1)
		)
		.addColumn('data', 'text', (col) => col.notNull().defaultTo('{}'))
		.addColumn('revision', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('updated_at', 'integer', (col) => col.notNull())
		.addPrimaryKeyConstraint('user_state_primary_key', [
			'user_id',
			'namespace',
		])
		.execute();

	for (const tableName of Object.keys(ACCOUNT_TABLE_COLUMNS_MAP)) {
		await ensureTableColumns(
			database,
			tableName as keyof typeof ACCOUNT_TABLE_COLUMNS_MAP
		);
	}

	await ensureAccountTableStructure(database);
}
