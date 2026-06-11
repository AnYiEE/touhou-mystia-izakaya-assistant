import { type Kysely } from 'kysely';

import { getAccountFeatureStatus } from './environment';
import { type TDatabase } from '@/lib/db/types';

type TAccountDatabase = Kysely<TDatabase>;

export class AccountFeatureError extends Error {
	readonly reason: string;

	constructor(reason: string) {
		super(reason);
		this.name = 'AccountFeatureError';
		this.reason = reason;
	}
}

let databasePromise: Promise<TAccountDatabase> | null = null;

async function loadAccountDatabase() {
	const [{ db }, { migrateAccountTables }] = await Promise.all([
		import('@/lib/db/db'),
		import('@/lib/db/migrations/account'),
	]);

	await migrateAccountTables(db);
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
