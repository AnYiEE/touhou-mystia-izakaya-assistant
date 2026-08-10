import 'client-only';

import {
	type DBSchema,
	type IDBPDatabase,
	type IDBPTransaction,
	openDB,
} from 'idb';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	canAddNonNegativeSafeIntegers,
	isNonNegativeSafeInteger,
} from '@/shared/utilities/numbers/check';

const CROSS_TAB_LOCK_DATABASE_NAME = 'touhou-mystia-izakaya-cross-tab-locks';
const CROSS_TAB_LOCK_DATABASE_VERSION = 1;
const CROSS_TAB_LOCK_STORE_NAME = 'locks';

interface ICrossTabLockRecord {
	expiresAt: number;
	name: string;
	ownerId: string;
}

interface ICrossTabLockDatabase extends DBSchema {
	locks: { key: string; value: ICrossTabLockRecord };
}

type TCrossTabLockTransaction = IDBPTransaction<
	ICrossTabLockDatabase,
	['locks'],
	'readwrite'
>;

type TCrossTabLockAcquireResult = 'acquired' | 'busy' | 'unavailable';
type TCrossTabLockReleaseResult = 'not-owned' | 'released' | 'unavailable';
type TCrossTabLockRenewResult = 'lost' | 'renewed' | 'unavailable';

let databasePromise: Promise<IDBPDatabase<ICrossTabLockDatabase>> | undefined;
let openedDatabase: IDBPDatabase<ICrossTabLockDatabase> | undefined;

class CrossTabLockDatabaseBlockedError extends Error {
	public readonly code = 'cross-tab-lock-database-blocked';

	public constructor() {
		super();
		this.name = 'CrossTabLockDatabaseBlockedError';
	}
}

function checkCrossTabLockRecord(
	value: unknown,
	name: string
): value is ICrossTabLockRecord {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	const record = value as Partial<Record<keyof ICrossTabLockRecord, unknown>>;
	return (
		record.name === name &&
		typeof record.ownerId === 'string' &&
		record.ownerId !== '' &&
		isNonNegativeSafeInteger(record.expiresAt)
	);
}

function resetCrossTabLockDatabase(
	database?: IDBPDatabase<ICrossTabLockDatabase>
) {
	if (database !== undefined && openedDatabase !== database) {
		return;
	}

	openedDatabase?.close();
	openedDatabase = undefined;
	databasePromise = undefined;
}

function openCrossTabLockDatabase() {
	return new Promise<IDBPDatabase<ICrossTabLockDatabase>>(
		(resolve, reject) => {
			let isSettled = false;
			void openDB<ICrossTabLockDatabase>(
				CROSS_TAB_LOCK_DATABASE_NAME,
				CROSS_TAB_LOCK_DATABASE_VERSION,
				{
					blocked() {
						if (isSettled) {
							return;
						}

						isSettled = true;
						reject(new CrossTabLockDatabaseBlockedError());
					},
					blocking() {
						resetCrossTabLockDatabase();
					},
					terminated() {
						resetCrossTabLockDatabase();
					},
					upgrade(database) {
						if (
							!database.objectStoreNames.contains(
								CROSS_TAB_LOCK_STORE_NAME
							)
						) {
							database.createObjectStore(
								CROSS_TAB_LOCK_STORE_NAME,
								{ keyPath: 'name' }
							);
						}
					},
				}
			).then(
				(database) => {
					if (isSettled) {
						database.close();
						return;
					}

					isSettled = true;
					resolve(database);
				},
				(error: unknown) => {
					if (isSettled) {
						return;
					}

					isSettled = true;
					reject(
						Error.isError(error)
							? error
							: new Error('cross-tab-lock-database-open-failed')
					);
				}
			);
		}
	);
}

async function getCrossTabLockDatabase() {
	if (typeof indexedDB === 'undefined') {
		return;
	}

	databasePromise ??= openCrossTabLockDatabase().then((database) => {
		openedDatabase = database;
		return database;
	});
	const currentDatabasePromise = databasePromise;
	let availableDatabase: IDBPDatabase<ICrossTabLockDatabase> | undefined;
	try {
		availableDatabase = await currentDatabasePromise;
	} catch (error) {
		if (databasePromise === currentDatabasePromise) {
			databasePromise = undefined;
		}
		console.warn('Cross-tab lock database unavailable.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
	return availableDatabase;
}

async function runCrossTabLockTransaction<T>(
	action: (transaction: TCrossTabLockTransaction) => Promise<T>
): Promise<T | 'unavailable'> {
	const database = await getCrossTabLockDatabase();
	if (database === undefined) {
		return 'unavailable';
	}

	let transaction: TCrossTabLockTransaction | undefined;
	try {
		transaction = database.transaction(
			CROSS_TAB_LOCK_STORE_NAME,
			'readwrite'
		);
		const result = await action(transaction);
		await transaction.done;
		return result;
	} catch (error) {
		if (transaction !== undefined) {
			try {
				await transaction.done;
			} catch {
				// Preserve the request error after observing the transaction failure.
			}
		}
		resetCrossTabLockDatabase(database);
		console.warn('Cross-tab lock database transaction failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return 'unavailable';
	}
}

export function acquireCrossTabIdbLock({
	fallbackTtl,
	name,
	ownerId,
}: {
	fallbackTtl: number;
	name: string;
	ownerId: string;
}): Promise<TCrossTabLockAcquireResult> {
	return runCrossTabLockTransaction(async (transaction) => {
		const store = transaction.objectStore(CROSS_TAB_LOCK_STORE_NAME);
		const current = await store.get(name);
		const now = Date.now();
		if (checkCrossTabLockRecord(current, name) && current.expiresAt > now) {
			return 'busy' as const;
		}

		if (!canAddNonNegativeSafeIntegers(now, fallbackTtl)) {
			return 'unavailable' as const;
		}

		await store.put({ expiresAt: now + fallbackTtl, name, ownerId });
		return 'acquired' as const;
	});
}

export function releaseCrossTabIdbLock({
	name,
	ownerId,
}: {
	name: string;
	ownerId: string;
}): Promise<TCrossTabLockReleaseResult> {
	return runCrossTabLockTransaction(async (transaction) => {
		const store = transaction.objectStore(CROSS_TAB_LOCK_STORE_NAME);
		const current = await store.get(name);
		if (
			!checkCrossTabLockRecord(current, name) ||
			current.ownerId !== ownerId
		) {
			return 'not-owned' as const;
		}

		await store.delete(name);
		return 'released' as const;
	});
}

export function renewCrossTabIdbLock({
	fallbackTtl,
	name,
	ownerId,
}: {
	fallbackTtl: number;
	name: string;
	ownerId: string;
}): Promise<TCrossTabLockRenewResult> {
	return runCrossTabLockTransaction(async (transaction) => {
		const store = transaction.objectStore(CROSS_TAB_LOCK_STORE_NAME);
		const current = await store.get(name);
		if (
			!checkCrossTabLockRecord(current, name) ||
			current.ownerId !== ownerId
		) {
			return 'lost' as const;
		}

		const now = Date.now();
		if (!canAddNonNegativeSafeIntegers(now, fallbackTtl)) {
			return 'unavailable' as const;
		}
		await store.put({ expiresAt: now + fallbackTtl, name, ownerId });
		return 'renewed' as const;
	});
}
