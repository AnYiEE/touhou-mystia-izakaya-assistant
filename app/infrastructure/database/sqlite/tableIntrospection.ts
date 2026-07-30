import { type Kysely, sql } from 'kysely';

type TSqliteQueryExecutor = Pick<Kysely<unknown>, 'getExecutor'>;

export interface ISqliteForeignKeyInfo {
	from: string;
	on_delete: string;
	table: string;
	to: string;
}

export interface ISqlitePrimaryKeyColumnInfo {
	name: string;
	notNull: boolean;
}

export interface ISqliteTableColumnInfo {
	defaultValue: string | null;
	hidden: number;
	name: string;
	notNull: boolean;
	primaryKeyOrdinal: number;
	type: string;
}

export interface ISqliteTableSchemaObjectInfo {
	name: string;
	origin: 'c' | 'u' | null;
	type: 'index' | 'trigger';
}

export async function getTableColumnInfo(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const { rows } = await sql<{
		dflt_value: string | null;
		hidden: number;
		name: string;
		notnull: number;
		pk: number;
		type: string;
	}>`
		select name, "notnull", pk, type, dflt_value, hidden
		from pragma_table_xinfo(${tableName})
	`.execute(database);

	return rows.map((row) => ({
		defaultValue: row.dflt_value,
		hidden: row.hidden,
		name: row.name,
		notNull: row.notnull === 1,
		primaryKeyOrdinal: row.pk,
		type: row.type.toLowerCase(),
	}));
}

export async function getTableColumns(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const columns = await getTableColumnInfo(database, tableName);

	return columns.map(({ name }) => name);
}

export async function getPrimaryKeyColumns(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const columns = await getTableColumnInfo(database, tableName);

	return columns
		.filter((column) => column.primaryKeyOrdinal > 0)
		.sort((left, right) => left.primaryKeyOrdinal - right.primaryKeyOrdinal)
		.map((column) => ({ name: column.name, notNull: column.notNull }));
}

export async function getTableSchemaObjects(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const { rows } = await sql<ISqliteTableSchemaObjectInfo>`
		select name, 'index' as type, origin
		from pragma_index_list(${tableName})
		where origin <> 'pk'
		union all
		select name, 'trigger' as type, null as origin
		from sqlite_master
		where tbl_name = ${tableName} and type = 'trigger'
		order by type, name
	`.execute(database);

	return rows;
}

export async function getCreateTableSql(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const { rows } = await sql<{ sql: string | null }>`
		select sql
		from sqlite_master
		where type = 'table' and name = ${tableName}
	`.execute(database);

	return rows[0]?.sql ?? null;
}

export async function getForeignKeys(
	database: TSqliteQueryExecutor,
	tableName: string
) {
	const { rows } = await sql<ISqliteForeignKeyInfo>`
		select "from", "table", "to", on_delete
		from pragma_foreign_key_list(${tableName})
	`.execute(database);

	return rows;
}
