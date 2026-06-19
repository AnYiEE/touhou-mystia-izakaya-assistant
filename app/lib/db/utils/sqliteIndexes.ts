import { type Kysely, sql } from 'kysely';

interface IPragmaIndexInfoRow {
	name: string | null;
	seqno: number;
}

interface IPragmaIndexListRow {
	name: string;
	partial: number;
	unique: number;
}

interface ISqliteMasterIndexRow {
	sql: string | null;
	tbl_name: string;
}

export interface ISqliteIndexDefinition {
	columns: ReadonlyArray<string>;
	indexName: string;
	tableName: string;
	unique?: boolean;
	where?: string;
}

function normalizeSql(value: string) {
	return value.replaceAll(/\s+/gu, ' ').trim().toLowerCase();
}

async function getCreateIndexSql<T>(database: Kysely<T>, indexName: string) {
	const { rows } = await sql<ISqliteMasterIndexRow>`
		select tbl_name, sql
		from sqlite_master
		where type = 'index' and name = ${indexName}
	`.execute(database);

	return rows[0] ?? null;
}

async function getNamedIndex<T>(
	database: Kysely<T>,
	tableName: string,
	indexName: string
) {
	const { rows } = await sql<IPragmaIndexListRow>`
		select name, "unique", partial
		from pragma_index_list(${tableName})
	`.execute(database);

	return rows.find((index) => index.name === indexName) ?? null;
}

async function getIndexColumns<T>(database: Kysely<T>, indexName: string) {
	const { rows } = await sql<IPragmaIndexInfoRow>`
		select name, seqno
		from pragma_index_info(${indexName})
	`.execute(database);

	return rows
		.sort((left, right) => left.seqno - right.seqno)
		.map((column) => column.name);
}

async function checkSqliteIndexMatches<T>(
	database: Kysely<T>,
	definition: ISqliteIndexDefinition
) {
	const { columns, indexName, tableName, unique, where } = definition;
	const existingIndex = await getNamedIndex(database, tableName, indexName);
	const existingIndexSql = await getCreateIndexSql(database, indexName);

	if (existingIndexSql !== null && existingIndexSql.tbl_name !== tableName) {
		return false;
	}

	if (existingIndex === null) {
		return existingIndexSql === null;
	}

	const actualColumns = await getIndexColumns(database, indexName);
	const expectedUnique = unique === true;
	const expectedPartial = where !== undefined;
	const hasExpectedColumns =
		actualColumns.length === columns.length &&
		actualColumns.every((column, index) => column === columns[index]);
	const hasExpectedUniqueness =
		(existingIndex.unique === 1) === expectedUnique;
	const hasExpectedPartial =
		(existingIndex.partial === 1) === expectedPartial;

	if (!hasExpectedColumns || !hasExpectedUniqueness || !hasExpectedPartial) {
		return false;
	}

	if (where === undefined) {
		return true;
	}

	return (
		existingIndexSql?.sql !== null &&
		existingIndexSql?.sql !== undefined &&
		normalizeSql(existingIndexSql.sql).includes(
			`where ${normalizeSql(where)}`
		)
	);
}

export async function dropSqliteIndexIfMismatched<T>(
	database: Kysely<T>,
	definition: ISqliteIndexDefinition
) {
	if (await checkSqliteIndexMatches(database, definition)) {
		return;
	}

	await database.schema.dropIndex(definition.indexName).ifExists().execute();
}

export async function dropMismatchedSqliteIndexes<T>(
	database: Kysely<T>,
	definitions: ReadonlyArray<ISqliteIndexDefinition>
) {
	for (const definition of definitions) {
		await dropSqliteIndexIfMismatched(database, definition);
	}
}
