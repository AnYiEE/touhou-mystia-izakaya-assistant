import { type Kysely } from 'kysely';

import { getAccountFeatureStatus } from './environment';
import { type TDatabase } from '@/lib/db/types';

type TAccountDatabase = Kysely<TDatabase>;

const MIGRATION_RETRY_DELAYS_MS = [25, 50, 100, 200, 400] as const;

export class AccountFeatureError extends Error {
	readonly reason: string;

	constructor(reason: string) {
		super(reason);
		this.name = 'AccountFeatureError';
		this.reason = reason;
	}
}

let databasePromise: Promise<TAccountDatabase> | null = null;

function checkRetryableMigrationRace(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	const errorCode = (error as NodeJS.ErrnoException).code;
	return (
		errorCode === 'SQLITE_LOCKED' ||
		error.message.includes('server-misconfigured:')
	);
}

async function migrateAccountTablesWithRaceRecovery(
	database: TAccountDatabase,
	migrate: (database: TAccountDatabase) => Promise<void>
) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			await migrate(database);
			return;
		} catch (error) {
			const retryDelay = MIGRATION_RETRY_DELAYS_MS[attempt];
			if (
				retryDelay === undefined ||
				!checkRetryableMigrationRace(error)
			) {
				throw error;
			}

			await new Promise<void>((resolve) => {
				setTimeout(resolve, retryDelay);
			});
		}
	}
}

async function loadAccountDatabase() {
	const [{ db }, { migrateAccountTables }] = await Promise.all([
		import('@/lib/db/db'),
		import('@/lib/db/migrations/account'),
	]);

	await migrateAccountTablesWithRaceRecovery(db, migrateAccountTables);

	return db;
}

export async function getAccountDatabase() {
	const status = await getAccountFeatureStatus();
	if (!status.enabled) {
		throw new AccountFeatureError(status.reason);
	}

	databasePromise ??= loadAccountDatabase();

	try {
		return await databasePromise;
	} catch (error) {
		databasePromise = null;
		throw error;
	}
}
