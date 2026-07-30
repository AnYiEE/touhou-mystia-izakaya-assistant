import { type ColumnDataType, type Kysely } from 'kysely';

export interface ISqliteMigrationColumnDefinition {
	dataType: ColumnDataType;
	defaultTo?: number | string;
	notNull?: boolean;
}

function checkDuplicateColumnError(error: unknown) {
	return (
		error instanceof Error && /duplicate column name/iu.test(error.message)
	);
}

export async function addMissingSqliteColumn<T>(
	database: Kysely<T>,
	tableName: string,
	columnName: string,
	definition: ISqliteMigrationColumnDefinition
) {
	try {
		await database.schema
			.alterTable(tableName)
			.addColumn(columnName, definition.dataType, (column) => {
				let builder =
					definition.notNull === true ? column.notNull() : column;

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
