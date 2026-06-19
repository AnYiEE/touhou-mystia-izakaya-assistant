import { type ColumnDataType, type Kysely, sql } from 'kysely';
import { createHash } from 'node:crypto';

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

interface ILegacySsoClientSecretRow {
	created_at: number;
	id: string;
	secret_hashes: string;
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
		'generation',
		'lease_token',
		'lease_expires_at',
		'metadata_json',
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
		'disabled_at',
		'deleted_at',
		'deleted_by_admin',
		'status_callback_url',
		'cancel_redirect_uri',
		'created_at',
		'updated_at',
	],
	[TABLE_NAME_MAP.ssoClientSecret]: [
		'id',
		'client_id',
		'secret_hash',
		'label',
		'position',
		'created_at',
		'created_by_admin',
		'last_used_at',
		'disabled_at',
		'revoked_at',
	],
	[TABLE_NAME_MAP.ssoGrantEvent]: [
		'id',
		'client_id',
		'user_id',
		'event',
		'actor_type',
		'actor_id',
		'reason',
		'created_at',
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
		'revoked_at',
		'revoked_reason',
	],
	[TABLE_NAME_MAP.ssoUserClientGrant]: [
		'client_id',
		'user_id',
		'created_at',
		'updated_at',
	],
	[TABLE_NAME_MAP.ssoCallbackDelivery]: [
		'id',
		'queue_key',
		'client_id',
		'user_id',
		'event',
		'metadata_json',
		'attempt',
		'status',
		'http_status',
		'duration_ms',
		'error',
		'created_at',
	],
	[TABLE_NAME_MAP.accountAuditLog]: [
		'id',
		'scope',
		'action',
		'actor_type',
		'actor_id',
		'target_type',
		'target_id',
		'metadata_json',
		'ip_hash',
		'user_agent_hash',
		'created_at',
	],
} as const;

const SSO_TABLE_COLUMN_DEFINITION_MAP = {
	[TABLE_NAME_MAP.ssoCallbackQueue]: {
		attempts: { dataType: 'integer', defaultTo: 0, notNull: true },
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		event: { dataType: 'text', defaultTo: '', notNull: true },
		generation: { dataType: 'integer', defaultTo: 0, notNull: true },
		id: { dataType: 'integer', structural: true },
		last_error: { dataType: 'text' },
		lease_expires_at: { dataType: 'integer' },
		lease_token: { dataType: 'text' },
		metadata_json: { dataType: 'text', defaultTo: '{}', notNull: true },
		next_retry_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		timestamp: { dataType: 'integer', defaultTo: 0, notNull: true },
		user_id: { dataType: 'text' },
	},
	[TABLE_NAME_MAP.ssoClient]: {
		cancel_redirect_uri: { dataType: 'text' },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		custom_scheme_redirect_uris: {
			dataType: 'text',
			defaultTo: '[]',
			notNull: true,
		},
		deleted_at: { dataType: 'integer' },
		deleted_by_admin: { dataType: 'text' },
		disabled_at: { dataType: 'integer' },
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
	[TABLE_NAME_MAP.ssoClientSecret]: {
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		created_by_admin: { dataType: 'text' },
		disabled_at: { dataType: 'integer' },
		id: { dataType: 'text', structural: true },
		label: { dataType: 'text' },
		last_used_at: { dataType: 'integer' },
		position: { dataType: 'integer', defaultTo: 0, notNull: true },
		revoked_at: { dataType: 'integer' },
		secret_hash: { dataType: 'text', defaultTo: '', notNull: true },
	},
	[TABLE_NAME_MAP.ssoGrantEvent]: {
		actor_id: { dataType: 'text' },
		actor_type: { dataType: 'text', defaultTo: 'system', notNull: true },
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		event: { dataType: 'text', defaultTo: '', notNull: true },
		id: { dataType: 'integer', structural: true },
		reason: { dataType: 'text' },
		user_id: { dataType: 'text', defaultTo: '', notNull: true },
	},
	[TABLE_NAME_MAP.ssoTicket]: {
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		code_challenge: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		expires_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		redirect_uri: { dataType: 'text', defaultTo: '', notNull: true },
		revoked_at: { dataType: 'integer' },
		revoked_reason: { dataType: 'text' },
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
	[TABLE_NAME_MAP.ssoCallbackDelivery]: {
		attempt: { dataType: 'integer', defaultTo: 0, notNull: true },
		client_id: { dataType: 'text', defaultTo: '', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		duration_ms: { dataType: 'integer' },
		error: { dataType: 'text' },
		event: { dataType: 'text', defaultTo: '', notNull: true },
		http_status: { dataType: 'integer' },
		id: { dataType: 'integer', structural: true },
		metadata_json: { dataType: 'text', defaultTo: '{}', notNull: true },
		queue_key: { dataType: 'text', defaultTo: '', notNull: true },
		status: { dataType: 'text', defaultTo: 'failed', notNull: true },
		user_id: { dataType: 'text' },
	},
	[TABLE_NAME_MAP.accountAuditLog]: {
		action: { dataType: 'text', defaultTo: '', notNull: true },
		actor_id: { dataType: 'text' },
		actor_type: { dataType: 'text', defaultTo: 'system', notNull: true },
		created_at: { dataType: 'integer', defaultTo: 0, notNull: true },
		id: { dataType: 'integer', structural: true },
		ip_hash: { dataType: 'text' },
		metadata_json: { dataType: 'text', defaultTo: '{}', notNull: true },
		scope: { dataType: 'text', defaultTo: '', notNull: true },
		target_id: { dataType: 'text' },
		target_type: { dataType: 'text', defaultTo: '', notNull: true },
		user_agent_hash: { dataType: 'text' },
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

async function getCreateIndexSql(
	database: Kysely<TDatabase>,
	indexName: string
) {
	const row = await sql<ISqliteMasterTableRow>`
		select sql
		from sqlite_master
		where type = 'index' and name = ${indexName}
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

	const callbackEventCheck = /event in \(([^)]*)\)/u.exec(normalizedSql)?.[1];
	if (callbackEventCheck === undefined) {
		return false;
	}

	return [
		'client_deleted',
		'client_disabled',
		'grant_revoked',
		'secret_rotated',
		'user_deleted',
		'user_disabled',
		'user_profile_updated',
	].every((event) => callbackEventCheck.includes(`'${event}'`));
}

async function hasNullableColumn(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
	columnName: string
) {
	const { rows } = await sql<IPragmaTableInfoRow>`
		select name, "notnull", pk
		from pragma_table_info(${tableName})
	`.execute(database);
	return rows.find((column) => column.name === columnName)?.notnull === 0;
}

async function hasNonUniqueIndex(
	database: Kysely<TDatabase>,
	tableName: TSsoTableName,
	columnNames: string[]
) {
	const { rows: indexes } = await sql<IPragmaIndexListRow>`
		select name, "unique"
		from pragma_index_list(${tableName})
	`.execute(database);

	for (const index of indexes) {
		if (index.unique !== 0) {
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

async function hasExpectedCallbackQueuePartialUniqueIndex(
	database: Kysely<TDatabase>,
	indexName: string,
	columnNames: string[],
	expectedPredicate: string
) {
	if (
		!(await hasUniqueIndex(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			columnNames
		))
	) {
		return false;
	}

	const createIndexSql = await getCreateIndexSql(database, indexName);
	const normalizedSql = createIndexSql
		.replaceAll(/\s+/gu, ' ')
		.trim()
		.toLowerCase();

	return normalizedSql.includes(`where ${expectedPredicate}`);
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

function parseLegacySecretHashes(value: string) {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return [];
	}

	if (!Array.isArray(parsed)) {
		return [];
	}

	return parsed.filter(
		(secretHash): secretHash is string =>
			typeof secretHash === 'string' && /^[a-f0-9]{64}$/u.test(secretHash)
	);
}

function createLegacySecretId(clientId: string, secretHash: string) {
	return createHash('sha256')
		.update(`${clientId}:${secretHash}`)
		.digest('hex')
		.slice(0, 32);
}

async function backfillSsoClientSecrets(database: Kysely<TDatabase>) {
	const records = await database
		.selectFrom(TABLE_NAME_MAP.ssoClient)
		.select(['id', 'secret_hashes', 'created_at'])
		.execute();

	for (const record of records as ILegacySsoClientSecretRow[]) {
		const secretHashes = parseLegacySecretHashes(record.secret_hashes);
		if (secretHashes.length === 0) {
			continue;
		}

		await database
			.insertInto(TABLE_NAME_MAP.ssoClientSecret)
			.values(
				secretHashes.map((secretHash, index) => ({
					client_id: record.id,
					created_at: record.created_at,
					created_by_admin: null,
					disabled_at: null,
					id: createLegacySecretId(record.id, secretHash),
					label: `Legacy secret #${index + 1}`,
					last_used_at: null,
					position: index,
					revoked_at: null,
					secret_hash: secretHash,
				}))
			)
			.onConflict((oc) =>
				oc.columns(['client_id', 'secret_hash']).doNothing()
			)
			.execute();
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
				used_at integer,
				revoked_at integer,
				revoked_reason text
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
				used_at,
				revoked_at,
				revoked_reason
			)
			select
				ticket_hash,
				client_id,
				user_id,
				redirect_uri,
				code_challenge,
				created_at,
				expires_at,
				used_at,
				revoked_at,
				revoked_reason
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
	const oldColumns = await getTableColumns(
		database,
		TABLE_NAME_MAP.ssoCallbackQueue
	);
	const metadataJsonSelect = oldColumns.includes('metadata_json')
		? sql`metadata_json`
		: sql`'{}'`;

	await database.transaction().execute(async (transaction) => {
		await sql`drop table if exists ${nextTableName}`.execute(transaction);
		await sql`
			create table ${nextTableName} (
				id integer not null primary key autoincrement,
				client_id text not null references ${clientTableName}(id) on delete cascade,
				user_id text references ${userTableName}(id) on delete cascade,
				event text not null check(event in ('client_deleted', 'client_disabled', 'grant_revoked', 'secret_rotated', 'user_deleted', 'user_disabled', 'user_profile_updated')),
				generation integer not null default 0,
				lease_token text,
				lease_expires_at integer,
				metadata_json text not null default '{}',
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
				generation,
				lease_token,
				lease_expires_at,
				metadata_json,
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
				0,
				null,
				null,
				${metadataJsonSelect},
				timestamp,
				attempts,
				last_error,
				next_retry_at,
				created_at
			from ${oldTableName}
			where exists (
				select 1 from ${clientTableName}
				where ${clientTableName}.id = ${oldTableName}.client_id
			)
				and (
					(
						event in ('grant_revoked', 'user_deleted', 'user_disabled', 'user_profile_updated')
						and user_id is not null
						and exists (
							select 1 from ${userTableName}
							where ${userTableName}.id = ${oldTableName}.user_id
						)
						and id in (
							select max(id)
							from ${oldTableName}
							where event in ('grant_revoked', 'user_deleted', 'user_disabled', 'user_profile_updated')
								and user_id is not null
							group by client_id, user_id, event
						)
					)
					or (
						event in ('client_deleted', 'client_disabled', 'secret_rotated')
						and user_id is null
						and id in (
							select max(id)
							from ${oldTableName}
							where event in ('client_deleted', 'client_disabled', 'secret_rotated')
								and user_id is null
							group by client_id, event
						)
					)
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

async function rebuildSsoCallbackDeliveryTable(database: Kysely<TDatabase>) {
	const oldTableName = sql.raw(TABLE_NAME_MAP.ssoCallbackDelivery);
	const nextTableName = sql.raw(`${TABLE_NAME_MAP.ssoCallbackDelivery}_next`);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);

	await database.transaction().execute(async (transaction) => {
		await sql`drop table if exists ${nextTableName}`.execute(transaction);
		await sql`
			create table ${nextTableName} (
				id integer not null primary key autoincrement,
				queue_key text not null,
				client_id text not null references ${clientTableName}(id) on delete cascade,
				user_id text references ${userTableName}(id) on delete cascade,
				event text not null,
				metadata_json text not null default '{}',
				attempt integer not null default 0,
				status text not null,
				http_status integer,
				duration_ms integer,
				error text,
				created_at integer not null
			)
		`.execute(transaction);
		await sql`
			insert into ${nextTableName} (
				id,
				queue_key,
				client_id,
				user_id,
				event,
				metadata_json,
				attempt,
				status,
				http_status,
				duration_ms,
				error,
				created_at
			)
			select
				id,
				queue_key,
				client_id,
				user_id,
				event,
				'{}',
				attempt,
				status,
				http_status,
				duration_ms,
				error,
				created_at
			from ${oldTableName}
			where exists (
				select 1 from ${clientTableName}
				where ${clientTableName}.id = ${oldTableName}.client_id
			) and (
				${oldTableName}.user_id is null
				or exists (
					select 1 from ${userTableName}
					where ${userTableName}.id = ${oldTableName}.user_id
				)
			)
		`.execute(transaction);
		await sql`drop table ${oldTableName}`.execute(transaction);
		await sql`alter table ${nextTableName} rename to ${oldTableName}`.execute(
			transaction
		);
	});
}

async function ensureSsoCallbackQueueIndexes(database: Kysely<TDatabase>) {
	const callbackQueueTableName = sql.raw(TABLE_NAME_MAP.ssoCallbackQueue);

	await database.schema
		.dropIndex('sso_callback_queue_client_user_event_index')
		.ifExists()
		.execute();
	await database.schema
		.dropIndex('sso_callback_queue_client_user_event_unique_index')
		.ifExists()
		.execute();
	await database.schema
		.dropIndex('sso_callback_queue_user_event_unique_index')
		.ifExists()
		.execute();
	await database.schema
		.dropIndex('sso_callback_queue_client_event_unique_index')
		.ifExists()
		.execute();
	await sql`
		delete from ${callbackQueueTableName}
		where user_id is not null
			and id not in (
				select max(id)
				from ${callbackQueueTableName}
				where user_id is not null
				group by client_id, user_id, event
			)
	`.execute(database);
	await sql`
		delete from ${callbackQueueTableName}
		where user_id is null
			and id not in (
				select max(id)
				from ${callbackQueueTableName}
				where user_id is null
				group by client_id, event
			)
	`.execute(database);

	await sql`
		create unique index if not exists sso_callback_queue_user_event_unique_index
		on ${callbackQueueTableName} (client_id, user_id, event)
		where user_id is not null
	`.execute(database);
	await sql`
		create unique index if not exists sso_callback_queue_client_event_unique_index
		on ${callbackQueueTableName} (client_id, event)
		where user_id is null
	`.execute(database);

	await database.schema
		.createIndex('sso_callback_queue_client_event_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.columns(['client_id', 'event'])
		.execute();
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
		!(await hasNullableColumn(
			database,
			TABLE_NAME_MAP.ssoCallbackQueue,
			'user_id'
		)) ||
		!(await hasCallbackEventCheck(database));
	if (needsCallbackRebuild) {
		await rebuildSsoCallbackQueueTable(database);
	}

	const needsCallbackDeliveryRebuild =
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		)) ||
		!(await hasCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery,
			'user_id',
			TABLE_NAME_MAP.user
		)) ||
		!(await hasNullableColumn(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery,
			'user_id'
		));
	if (needsCallbackDeliveryRebuild) {
		await rebuildSsoCallbackDeliveryTable(database);
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

	const hasCallbackUserIndex =
		await hasExpectedCallbackQueuePartialUniqueIndex(
			database,
			'sso_callback_queue_user_event_unique_index',
			['client_id', 'user_id', 'event'],
			'user_id is not null'
		);
	const hasCallbackClientUniqueIndex =
		await hasExpectedCallbackQueuePartialUniqueIndex(
			database,
			'sso_callback_queue_client_event_unique_index',
			['client_id', 'event'],
			'user_id is null'
		);
	const hasCallbackClientIndex = await hasNonUniqueIndex(
		database,
		TABLE_NAME_MAP.ssoCallbackQueue,
		['client_id', 'event']
	);
	if (
		!hasCallbackUserIndex ||
		!hasCallbackClientUniqueIndex ||
		!hasCallbackClientIndex
	) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso_callback_queue must have indexes for user and client callback events`
		);
	}

	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoClientSecret,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoClientSecret),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoGrantEvent,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.ssoGrantEvent),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.ssoCallbackDelivery,
		await getPrimaryKeyColumns(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery
		),
		['id']
	);
	assertPrimaryKeyColumns(
		TABLE_NAME_MAP.accountAuditLog,
		await getPrimaryKeyColumns(database, TABLE_NAME_MAP.accountAuditLog),
		['id']
	);

	await Promise.all([
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoClientSecret,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoGrantEvent,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoGrantEvent,
			'user_id',
			TABLE_NAME_MAP.user
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery,
			'client_id',
			TABLE_NAME_MAP.ssoClient
		),
		assertCascadeForeignKey(
			database,
			TABLE_NAME_MAP.ssoCallbackDelivery,
			'user_id',
			TABLE_NAME_MAP.user
		),
	]);

	const hasSecretUniqueIndex = await hasUniqueIndex(
		database,
		TABLE_NAME_MAP.ssoClientSecret,
		['client_id', 'secret_hash']
	);
	if (!hasSecretUniqueIndex) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso_client_secrets must have a unique index on client_id, secret_hash`
		);
	}

	const hasGrantClientIndex = await hasNonUniqueIndex(
		database,
		TABLE_NAME_MAP.ssoUserClientGrant,
		['client_id', 'updated_at']
	);
	if (!hasGrantClientIndex) {
		throw new Error(
			`${SERVER_MISCONFIGURED_MESSAGE}: sso_user_client_grants must have an index on client_id, updated_at`
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
		.addColumn('disabled_at', 'integer')
		.addColumn('deleted_at', 'integer')
		.addColumn('deleted_by_admin', 'text')
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
		.addColumn('revoked_at', 'integer')
		.addColumn('revoked_reason', 'text')
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
			col.references(`${TABLE_NAME_MAP.user}.id`).onDelete('cascade')
		)
		.addColumn('event', 'text', (col) =>
			col
				.notNull()
				.check(
					sql`event in ('client_deleted', 'client_disabled', 'grant_revoked', 'secret_rotated', 'user_deleted', 'user_disabled', 'user_profile_updated')`
				)
		)
		.addColumn('generation', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('lease_token', 'text')
		.addColumn('lease_expires_at', 'integer')
		.addColumn('metadata_json', 'text', (col) =>
			col.notNull().defaultTo('{}')
		)
		.addColumn('timestamp', 'integer', (col) => col.notNull())
		.addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('last_error', 'text')
		.addColumn('next_retry_at', 'integer', (col) => col.notNull())
		.addColumn('created_at', 'integer', (col) => col.notNull())
		.execute();

	const secretTableName = sql.raw(TABLE_NAME_MAP.ssoClientSecret);
	const clientTableName = sql.raw(TABLE_NAME_MAP.ssoClient);
	await sql`
		create table if not exists ${secretTableName} (
			id text not null primary key,
			client_id text not null references ${clientTableName}(id) on delete cascade,
			secret_hash text not null,
			label text,
			position integer not null default 0,
			created_at integer not null,
			created_by_admin text,
			last_used_at integer,
			disabled_at integer,
			revoked_at integer
		)
	`.execute(database);

	const grantEventTableName = sql.raw(TABLE_NAME_MAP.ssoGrantEvent);
	const userTableName = sql.raw(TABLE_NAME_MAP.user);
	await sql`
		create table if not exists ${grantEventTableName} (
			id integer not null primary key autoincrement,
			client_id text not null references ${clientTableName}(id) on delete cascade,
			user_id text not null references ${userTableName}(id) on delete cascade,
			event text not null,
			actor_type text not null,
			actor_id text,
			reason text,
			created_at integer not null
		)
	`.execute(database);

	const callbackDeliveryTableName = sql.raw(
		TABLE_NAME_MAP.ssoCallbackDelivery
	);
	await sql`
		create table if not exists ${callbackDeliveryTableName} (
			id integer not null primary key autoincrement,
			queue_key text not null,
			client_id text not null references ${clientTableName}(id) on delete cascade,
			user_id text references ${userTableName}(id) on delete cascade,
			event text not null,
			metadata_json text not null default '{}',
			attempt integer not null default 0,
			status text not null,
			http_status integer,
			duration_ms integer,
			error text,
			created_at integer not null
		)
	`.execute(database);

	const auditTableName = sql.raw(TABLE_NAME_MAP.accountAuditLog);
	await sql`
		create table if not exists ${auditTableName} (
			id integer not null primary key autoincrement,
			scope text not null,
			action text not null,
			actor_type text not null,
			actor_id text,
			target_type text not null,
			target_id text,
			metadata_json text not null default '{}',
			ip_hash text,
			user_agent_hash text,
			created_at integer not null
		)
	`.execute(database);

	const grantTableName = sql.raw(TABLE_NAME_MAP.ssoUserClientGrant);
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
		.createIndex('sso_client_secrets_client_hash_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.ssoClientSecret)
		.columns(['client_id', 'secret_hash'])
		.execute();

	await backfillSsoClientSecrets(database);

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
		.createIndex('sso_tickets_client_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.columns(['client_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('sso_tickets_client_state_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.columns(['client_id', 'used_at', 'revoked_at', 'expires_at'])
		.execute();

	await database.schema
		.createIndex('sso_tickets_state_created_hash_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.columns([
			'used_at',
			'revoked_at',
			'expires_at',
			'created_at',
			'ticket_hash',
		])
		.execute();

	await database.schema
		.createIndex('sso_tickets_user_state_created_hash_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoTicket)
		.columns([
			'user_id',
			'used_at',
			'revoked_at',
			'expires_at',
			'created_at',
			'ticket_hash',
		])
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_next_retry_at_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.column('next_retry_at')
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_attempts_retry_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.columns(['attempts', 'next_retry_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_user_event_retry_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.columns(['user_id', 'event', 'next_retry_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_callback_queue_retry_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackQueue)
		.columns(['next_retry_at', 'created_at', 'id'])
		.execute();

	await ensureSsoCallbackQueueIndexes(database);

	await database.schema
		.createIndex('sso_user_client_grants_client_updated_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoUserClientGrant)
		.columns(['client_id', 'updated_at'])
		.execute();

	await database.schema
		.createIndex('sso_user_client_grants_user_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoUserClientGrant)
		.column('user_id')
		.execute();

	await database.schema
		.createIndex('sso_user_client_grants_user_updated_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoUserClientGrant)
		.columns(['user_id', 'updated_at'])
		.execute();

	await database.schema
		.createIndex('sso_user_client_grants_updated_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoUserClientGrant)
		.columns(['updated_at', 'client_id', 'user_id'])
		.execute();

	await database.schema
		.createIndex('sso_grant_events_client_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoGrantEvent)
		.columns(['client_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('sso_grant_events_user_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoGrantEvent)
		.columns(['user_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('sso_grant_events_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoGrantEvent)
		.columns(['created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_grant_events_event_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoGrantEvent)
		.columns(['event', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_grant_events_actor_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoGrantEvent)
		.columns(['actor_type', 'actor_id', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_client_secrets_client_status_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoClientSecret)
		.columns(['client_id', 'revoked_at', 'disabled_at'])
		.execute();

	await database.schema
		.createIndex('sso_callback_deliveries_client_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackDelivery)
		.columns(['client_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('sso_callback_deliveries_status_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackDelivery)
		.columns(['status', 'created_at'])
		.execute();

	await database.schema
		.createIndex('sso_callback_deliveries_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackDelivery)
		.columns(['created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('sso_callback_deliveries_user_event_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.ssoCallbackDelivery)
		.columns(['user_id', 'event', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_scope_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['scope', 'created_at'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_target_created_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['target_type', 'target_id', 'created_at'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_action_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['action', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_actor_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['actor_type', 'actor_id', 'created_at', 'id'])
		.execute();

	await database.schema
		.createIndex('account_audit_logs_target_id_created_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.accountAuditLog)
		.columns(['target_id', 'created_at', 'id'])
		.execute();

	await ensureSsoTableStructure(database);
}
