import { type Kysely, sql } from 'kysely';

import type { TDatabase } from '@/infrastructure/database/schema';
import { dropMismatchedSqliteIndexes } from '@/infrastructure/database/sqlite/indexes';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

const FEATURE_ACCESS_INDEX_DEFINITIONS = [
	{
		columns: ['name_normalized'],
		indexName: 'feature_access_groups_name_normalized_unique_index',
		tableName: TABLE_NAME_MAP.featureAccessGroup,
		unique: true,
	},
	{
		columns: ['user_id'],
		indexName: 'feature_access_group_members_user_id_index',
		tableName: TABLE_NAME_MAP.featureAccessGroupMember,
	},
	{
		columns: ['module_key'],
		indexName: 'feature_access_group_modules_module_key_index',
		tableName: TABLE_NAME_MAP.featureAccessGroupModule,
	},
	{
		columns: ['module_key'],
		indexName: 'user_feature_access_overrides_module_key_index',
		tableName: TABLE_NAME_MAP.userFeatureAccessOverride,
	},
] as const;

export async function migrateFeatureAccessTables(database: Kysely<TDatabase>) {
	await database.schema
		.createTable(TABLE_NAME_MAP.featureModulePolicy)
		.ifNotExists()
		.addColumn('module_key', 'text', (column) =>
			column.notNull().primaryKey()
		)
		.addColumn('access_level', 'text', (column) =>
			column
				.notNull()
				.check(
					sql`access_level in ('public', 'authenticated', 'granted')`
				)
		)
		.addColumn('updated_at', 'integer', (column) => column.notNull())
		.addColumn('updated_by_admin', 'text')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.featureAccessGroup)
		.ifNotExists()
		.addColumn('id', 'text', (column) => column.notNull().primaryKey())
		.addColumn('name', 'text', (column) => column.notNull())
		.addColumn('name_normalized', 'text', (column) => column.notNull())
		.addColumn('description', 'text', (column) =>
			column.notNull().defaultTo('')
		)
		.addColumn('created_at', 'integer', (column) => column.notNull())
		.addColumn('updated_at', 'integer', (column) => column.notNull())
		.addColumn('created_by_admin', 'text')
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.featureAccessGroupModule)
		.ifNotExists()
		.addColumn('group_id', 'text', (column) =>
			column
				.notNull()
				.references(`${TABLE_NAME_MAP.featureAccessGroup}.id`)
				.onDelete('cascade')
		)
		.addColumn('module_key', 'text', (column) => column.notNull())
		.addPrimaryKeyConstraint('feature_access_group_modules_primary_key', [
			'group_id',
			'module_key',
		])
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.featureAccessGroupMember)
		.ifNotExists()
		.addColumn('group_id', 'text', (column) =>
			column
				.notNull()
				.references(`${TABLE_NAME_MAP.featureAccessGroup}.id`)
				.onDelete('cascade')
		)
		.addColumn('user_id', 'text', (column) =>
			column
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('created_at', 'integer', (column) => column.notNull())
		.addColumn('created_by_admin', 'text')
		.addPrimaryKeyConstraint('feature_access_group_members_primary_key', [
			'group_id',
			'user_id',
		])
		.execute();

	await database.schema
		.createTable(TABLE_NAME_MAP.userFeatureAccessOverride)
		.ifNotExists()
		.addColumn('user_id', 'text', (column) =>
			column
				.notNull()
				.references(`${TABLE_NAME_MAP.user}.id`)
				.onDelete('cascade')
		)
		.addColumn('module_key', 'text', (column) => column.notNull())
		.addColumn('effect', 'text', (column) =>
			column.notNull().check(sql`effect in ('allow', 'deny')`)
		)
		.addColumn('created_at', 'integer', (column) => column.notNull())
		.addColumn('updated_at', 'integer', (column) => column.notNull())
		.addColumn('created_by_admin', 'text')
		.addColumn('updated_by_admin', 'text')
		.addPrimaryKeyConstraint('user_feature_access_overrides_primary_key', [
			'user_id',
			'module_key',
		])
		.execute();

	await dropMismatchedSqliteIndexes(
		database,
		FEATURE_ACCESS_INDEX_DEFINITIONS
	);

	await database.schema
		.createIndex('feature_access_groups_name_normalized_unique_index')
		.ifNotExists()
		.unique()
		.on(TABLE_NAME_MAP.featureAccessGroup)
		.column('name_normalized')
		.execute();
	await database.schema
		.createIndex('feature_access_group_members_user_id_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.featureAccessGroupMember)
		.column('user_id')
		.execute();
	await database.schema
		.createIndex('feature_access_group_modules_module_key_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.featureAccessGroupModule)
		.column('module_key')
		.execute();
	await database.schema
		.createIndex('user_feature_access_overrides_module_key_index')
		.ifNotExists()
		.on(TABLE_NAME_MAP.userFeatureAccessOverride)
		.column('module_key')
		.execute();
}
