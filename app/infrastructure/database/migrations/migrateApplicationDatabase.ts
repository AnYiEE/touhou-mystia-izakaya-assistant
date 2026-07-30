import { type Kysely } from 'kysely';

import type { TDatabase } from '@/infrastructure/database/schema';

import { migrateAccountTables } from './account';
import { migrateAnnouncementTables } from './announcements';
import { migrateLegacyBackupTables } from './legacyBackup';
import { migrateSiteRuntimeStateTable } from './siteStatus';
import { migrateSsoTables } from './sso';

export async function migrateApplicationDatabase(database: Kysely<TDatabase>) {
	await migrateLegacyBackupTables(database);
	await migrateAccountTables(database);
	await migrateAnnouncementTables(database);
	await migrateSsoTables(database);
	await migrateSiteRuntimeStateTable(database);
}
