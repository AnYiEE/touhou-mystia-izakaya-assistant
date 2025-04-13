import {Kysely, sql} from 'kysely';

export async function getTableColumns<T>(database: Kysely<T>, tableName: string) {
	const record = await sql<{
		name: string;
	}>`PRAGMA table_info(${sql.raw(tableName)})`.execute(database);

	return record.rows.map(({name}) => name);
}
