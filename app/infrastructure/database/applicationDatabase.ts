import { type Kysely } from 'kysely';

import { migrateApplicationDatabase } from './migrations/migrateApplicationDatabase';
import type { TDatabase } from './schema';
import { checkRetryableSqliteLockError } from './sqlite/lockErrors';

const MIGRATION_RETRY_DELAYS_MS = [25, 50, 100, 200, 400] as const;

export interface IApplicationDatabaseLoaderOptions {
	loadDatabase: () => Kysely<TDatabase> | Promise<Kysely<TDatabase>>;
	migrate: (database: Kysely<TDatabase>) => Promise<void>;
}

async function migrateWithRaceRecovery(
	database: Kysely<TDatabase>,
	migrate: (database: Kysely<TDatabase>) => Promise<void>
) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			await migrate(database);
			return;
		} catch (error) {
			const retryDelay = MIGRATION_RETRY_DELAYS_MS[attempt];
			if (
				retryDelay === undefined ||
				!checkRetryableSqliteLockError(error)
			) {
				throw error;
			}

			await new Promise<void>((resolve) => {
				setTimeout(resolve, retryDelay);
			});
		}
	}
}

export function createApplicationDatabaseLoader({
	loadDatabase,
	migrate,
}: IApplicationDatabaseLoaderOptions) {
	let databasePromise: Promise<Kysely<TDatabase>> | null = null;

	return async () => {
		databasePromise ??= (async () => {
			const database = await loadDatabase();
			await migrateWithRaceRecovery(database, migrate);
			return database;
		})();

		try {
			return await databasePromise;
		} catch (error) {
			databasePromise = null;
			throw error;
		}
	};
}

const loadApplicationDatabase = createApplicationDatabaseLoader({
	loadDatabase: async () => {
		const { database } = await import('./sqlite/database');
		return database;
	},
	migrate: migrateApplicationDatabase,
});

export async function getApplicationDatabase() {
	return await loadApplicationDatabase();
}
