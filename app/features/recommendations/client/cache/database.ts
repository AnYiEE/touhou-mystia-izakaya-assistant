'use client';

import { type IDBPDatabase, type IDBPTransaction, deleteDB, openDB } from 'idb';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	canAddNonNegativeSafeIntegers,
	canIncrementNonNegativeSafeInteger,
	isNonNegativeSafeInteger,
	isPositiveSafeInteger,
} from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	RECOMMENDATION_CACHE_DATABASE_VERSION,
	RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE,
	RECOMMENDATION_CACHE_RECORD_VERSION,
} from './constants';
import {
	getRecommendationCacheContext,
	getRecommendationCacheDatabaseName,
} from './context';
import { createStableFingerprint } from './fingerprint';
import type {
	IRecommendationCacheDatabase,
	IRecommendationCacheMetadata,
	IRecommendationCacheRecord,
	IRecommendationCacheStoreLimits,
	IRecommendationCacheStoreStats,
	TRecommendationCacheResultStoreName,
} from './types';

type TRecommendationCacheWriteTransaction = IDBPTransaction<
	IRecommendationCacheDatabase,
	Array<TRecommendationCacheResultStoreName | 'metadata'>,
	'readwrite'
>;

const LEGACY_SPECIAL_GUEST_PLAN_RESULT_STORE_NAME = 'customerRarePlanResults';

let databasePromise:
	| Promise<IDBPDatabase<IRecommendationCacheDatabase> | undefined>
	| undefined;
let openedDatabase: IDBPDatabase<IRecommendationCacheDatabase> | undefined;
let isCacheDisabled = false;
let isWriteDisabled = false;
let transactionFailureCount = 0;
let cleanupPromise: Promise<void> | undefined;
let isOldNamespaceCleanupComplete = false;
const touchedRecordIds = new Set<string>();
const touchingRecordIds = new Set<string>();
const CACHE_MISS = undefined;

async function runTransaction<T>(
	transaction: { readonly done: Promise<unknown> },
	action: () => Promise<T>
) {
	try {
		const result = await action();
		await transaction.done;
		return result;
	} catch (error) {
		try {
			await transaction.done;
		} catch {
			// Preserve the request error after observing the transaction failure.
		}
		throw error;
	}
}

function createMetadataId(
	namespace: string,
	storeName: TRecommendationCacheResultStoreName
) {
	return `${namespace}|${storeName}`;
}

function createRecordId(
	namespace: string,
	storeName: TRecommendationCacheResultStoreName,
	requestKey: string
) {
	return `${namespace}|${storeName}|${createStableFingerprint(requestKey)}`;
}

function createEmptyMetadata(
	namespace: string,
	storeName: TRecommendationCacheResultStoreName
): IRecommendationCacheMetadata {
	return {
		entryCount: 0,
		id: createMetadataId(namespace, storeName),
		logicalWeight: 0,
		namespace,
		storeName,
	};
}

function isValidMetadata(
	value: unknown,
	namespace: string,
	storeName: TRecommendationCacheResultStoreName
): value is IRecommendationCacheMetadata {
	if (!checkIsRecord(value)) {
		return false;
	}
	const metadata = value;
	return (
		metadata['id'] === createMetadataId(namespace, storeName) &&
		metadata['namespace'] === namespace &&
		metadata['storeName'] === storeName &&
		isPositiveSafeInteger(metadata['entryCount']) &&
		isPositiveSafeInteger(metadata['logicalWeight']) &&
		metadata['logicalWeight'] >= metadata['entryCount']
	);
}

function getRecordLogicalWeight(record: IRecommendationCacheRecord) {
	return isPositiveSafeInteger(record.logicalWeight)
		? record.logicalWeight
		: 1;
}

function addMetadataLogicalWeight(
	metadata: IRecommendationCacheMetadata,
	logicalWeight: number
) {
	if (!canAddNonNegativeSafeIntegers(metadata.logicalWeight, logicalWeight)) {
		throw new Error('recommendation-cache-metadata-overflow');
	}
	metadata.logicalWeight += logicalWeight;
}

function incrementMetadataEntryCount(metadata: IRecommendationCacheMetadata) {
	if (!canIncrementNonNegativeSafeInteger(metadata.entryCount)) {
		throw new Error('recommendation-cache-metadata-overflow');
	}
	metadata.entryCount++;
}

function disableCache() {
	isCacheDisabled = true;
	isWriteDisabled = true;
	openedDatabase?.close();
	openedDatabase = undefined;
}

function disableWrites() {
	isWriteDisabled = true;
}

function handleTransactionFailure(error: unknown) {
	transactionFailureCount++;
	console.warn('Recommendation cache transaction failed.', {
		errorCode: getLogSafeErrorCode(error),
	});
	if (transactionFailureCount >= 2) {
		disableCache();
	}
}

function handleTransactionSuccess() {
	transactionFailureCount = 0;
}

function isQuotaExceededError(error: unknown) {
	return (
		error instanceof DOMException &&
		(error.name === 'QuotaExceededError' ||
			error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
	);
}

function createResultStore(
	database: IDBPDatabase<IRecommendationCacheDatabase>,
	storeName: TRecommendationCacheResultStoreName
) {
	const store = database.createObjectStore(storeName, { keyPath: 'id' });
	store.createIndex('namespace', 'namespace');
	store.createIndex('namespaceLastAccessedAt', [
		'namespace',
		'lastAccessedAt',
	]);
}

async function getDatabase() {
	if (isCacheDisabled || typeof indexedDB === 'undefined') {
		return;
	}
	databasePromise ??= Promise.resolve()
		.then(() =>
			openDB<IRecommendationCacheDatabase>(
				getRecommendationCacheContext().databaseName,
				RECOMMENDATION_CACHE_DATABASE_VERSION,
				{
					blocked() {
						console.warn(
							'Recommendation cache database upgrade blocked.'
						);
					},
					blocking() {
						openedDatabase?.close();
						openedDatabase = undefined;
						databasePromise = undefined;
					},
					terminated() {
						disableCache();
					},
					upgrade(database) {
						const legacyDatabase = database as unknown as Pick<
							IDBDatabase,
							'deleteObjectStore' | 'objectStoreNames'
						>;
						if (
							legacyDatabase.objectStoreNames.contains(
								LEGACY_SPECIAL_GUEST_PLAN_RESULT_STORE_NAME
							)
						) {
							legacyDatabase.deleteObjectStore(
								LEGACY_SPECIAL_GUEST_PLAN_RESULT_STORE_NAME
							);
							if (
								legacyDatabase.objectStoreNames.contains(
									'metadata'
								)
							) {
								legacyDatabase.deleteObjectStore('metadata');
							}
						}
						if (!database.objectStoreNames.contains('metadata')) {
							database.createObjectStore('metadata', {
								keyPath: 'id',
							});
						}
						if (
							!database.objectStoreNames.contains(
								'specialGuestPlanResults'
							)
						) {
							createResultStore(
								database,
								'specialGuestPlanResults'
							);
						}
						if (
							!database.objectStoreNames.contains(
								'suggestedMealCardResults'
							)
						) {
							createResultStore(
								database,
								'suggestedMealCardResults'
							);
						}
					},
				}
			)
		)
		.then((database) => {
			openedDatabase = database;
			return database;
		})
		.catch((error: unknown) => {
			console.warn('Recommendation cache database unavailable.', {
				errorCode: getLogSafeErrorCode(error),
			});
			disableCache();
			return CACHE_MISS;
		});
	return databasePromise;
}

async function calculateMetadataForNamespace(
	transaction: TRecommendationCacheWriteTransaction,
	namespace: string,
	storeName: TRecommendationCacheResultStoreName
) {
	const metadata = createEmptyMetadata(namespace, storeName);
	let cursor = await transaction
		.objectStore(storeName)
		.index('namespace')
		.openCursor(namespace);
	while (cursor !== null) {
		incrementMetadataEntryCount(metadata);
		addMetadataLogicalWeight(
			metadata,
			getRecordLogicalWeight(cursor.value)
		);
		cursor = await cursor.continue();
	}
	return metadata;
}

async function readMetadataOrRebuild(
	transaction: TRecommendationCacheWriteTransaction,
	namespace: string,
	storeName: TRecommendationCacheResultStoreName,
	forceRebuild = false
) {
	const storedMetadata = forceRebuild
		? undefined
		: await transaction
				.objectStore('metadata')
				.get(createMetadataId(namespace, storeName));
	if (isValidMetadata(storedMetadata, namespace, storeName)) {
		return { isRebuilt: false, metadata: storedMetadata };
	}
	return {
		isRebuilt: true,
		metadata: await calculateMetadataForNamespace(
			transaction,
			namespace,
			storeName
		),
	};
}

async function updateMetadataForDeletedRecords(
	transaction: TRecommendationCacheWriteTransaction,
	deletedRecords: ReadonlyArray<{
		readonly logicalWeight: number;
		readonly namespace: string;
		readonly storeName: TRecommendationCacheResultStoreName;
	}>
) {
	const metadataStore = transaction.objectStore('metadata');
	const deltas = new Map<
		string,
		{
			entryCount: number;
			hasInvalidLogicalWeight: boolean;
			logicalWeight: number;
			namespace: string;
			storeName: TRecommendationCacheResultStoreName;
		}
	>();
	for (const record of deletedRecords) {
		const id = createMetadataId(record.namespace, record.storeName);
		const delta = deltas.get(id) ?? {
			entryCount: 0,
			hasInvalidLogicalWeight: false,
			logicalWeight: 0,
			namespace: record.namespace,
			storeName: record.storeName,
		};
		if (!canIncrementNonNegativeSafeInteger(delta.entryCount)) {
			throw new Error('recommendation-cache-metadata-overflow');
		}
		delta.entryCount++;
		if (isPositiveSafeInteger(record.logicalWeight)) {
			if (
				!canAddNonNegativeSafeIntegers(
					delta.logicalWeight,
					record.logicalWeight
				)
			) {
				throw new Error('recommendation-cache-metadata-overflow');
			}
			delta.logicalWeight += record.logicalWeight;
		} else {
			delta.hasInvalidLogicalWeight = true;
		}
		deltas.set(id, delta);
	}
	for (const [id, delta] of deltas) {
		const { isRebuilt, metadata } = await readMetadataOrRebuild(
			transaction,
			delta.namespace,
			delta.storeName,
			delta.hasInvalidLogicalWeight
		);
		const entryCount = isRebuilt
			? metadata.entryCount
			: Math.max(0, metadata.entryCount - delta.entryCount);
		const logicalWeight = isRebuilt
			? metadata.logicalWeight
			: Math.max(0, metadata.logicalWeight - delta.logicalWeight);
		await (entryCount === 0
			? metadataStore.delete(id)
			: metadataStore.put({ ...metadata, entryCount, logicalWeight }));
	}
}

async function rebuildMetadataForNamespace(
	transaction: TRecommendationCacheWriteTransaction,
	namespace: string,
	storeName: TRecommendationCacheResultStoreName
) {
	const metadataStore = transaction.objectStore('metadata');
	const metadata = await calculateMetadataForNamespace(
		transaction,
		namespace,
		storeName
	);
	await (metadata.entryCount === 0
		? metadataStore.delete(metadata.id)
		: metadataStore.put(metadata));
}

async function deleteOldNamespaceBatch(
	database: IDBPDatabase<IRecommendationCacheDatabase>
) {
	const { namespace } = getRecommendationCacheContext();
	const transaction = database.transaction(
		['suggestedMealCardResults', 'specialGuestPlanResults', 'metadata'],
		'readwrite'
	);
	const deletedRecords: Array<{
		logicalWeight: number;
		namespace: string;
		storeName: TRecommendationCacheResultStoreName;
	}> = [];
	const storeNames = [
		'suggestedMealCardResults',
		'specialGuestPlanResults',
	] as const;
	await runTransaction(transaction, async () => {
		for (const storeName of storeNames) {
			let cursor = await transaction.objectStore(storeName).openCursor();
			while (
				cursor !== null &&
				deletedRecords.length <
					RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE
			) {
				if (cursor.value.namespace !== namespace) {
					deletedRecords.push({
						logicalWeight: cursor.value.logicalWeight,
						namespace: cursor.value.namespace,
						storeName,
					});
					await cursor.delete();
				}
				cursor = await cursor.continue();
			}
			if (
				deletedRecords.length >=
				RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE
			) {
				break;
			}
		}
		await updateMetadataForDeletedRecords(transaction, deletedRecords);
	});
	handleTransactionSuccess();
	return deletedRecords.length;
}

function yieldToEventLoop() {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

async function cleanupOldNamespaces() {
	const database = await getDatabase();
	if (database === undefined) {
		return;
	}
	try {
		let deletedCount: number;
		do {
			deletedCount = await deleteOldNamespaceBatch(database);
			if (
				deletedCount >=
				RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE
			) {
				await yieldToEventLoop();
			}
		} while (
			deletedCount >= RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE
		);
		isOldNamespaceCleanupComplete = true;
	} catch (error) {
		handleTransactionFailure(error);
	}
}

async function ensureOldNamespacesCleaned(forceRescan = false) {
	if (forceRescan && cleanupPromise !== undefined) {
		await cleanupPromise;
	}
	if (forceRescan) {
		isOldNamespaceCleanupComplete = false;
	}
	if (isOldNamespaceCleanupComplete) {
		return;
	}
	cleanupPromise ??= cleanupOldNamespaces().finally(() => {
		cleanupPromise = undefined;
	});
	await cleanupPromise;
}

async function removeRecord(
	storeName: TRecommendationCacheResultStoreName,
	record: IRecommendationCacheRecord,
	namespace: string
) {
	const database = await getDatabase();
	if (database === undefined) {
		return;
	}
	try {
		const transaction = database.transaction(
			[storeName, 'metadata'],
			'readwrite'
		);
		await runTransaction(transaction, async () => {
			const resultStore = transaction.objectStore(storeName);
			const current = await resultStore.get(record.id);
			if (
				current?.createdAt !== record.createdAt ||
				current.lastAccessedAt !== record.lastAccessedAt ||
				current.logicalWeight !== record.logicalWeight ||
				current.namespace !== record.namespace ||
				current.recordVersion !== record.recordVersion ||
				current.requestKey !== record.requestKey
			) {
				return;
			}
			await resultStore.delete(record.id);
			await rebuildMetadataForNamespace(
				transaction,
				namespace,
				storeName
			);
		});
		handleTransactionSuccess();
	} catch (error) {
		handleTransactionFailure(error);
	}
}

async function touchRecord(
	storeName: TRecommendationCacheResultStoreName,
	record: IRecommendationCacheRecord
) {
	if (touchedRecordIds.has(record.id) || touchingRecordIds.has(record.id)) {
		return;
	}
	touchingRecordIds.add(record.id);
	try {
		const database = await getDatabase();
		if (database === undefined) {
			return;
		}
		const transaction = database.transaction(storeName, 'readwrite');
		const isTouched = await runTransaction(transaction, async () => {
			const store = transaction.objectStore(storeName);
			const current = await store.get(record.id);
			if (
				current?.requestKey !== record.requestKey ||
				current.namespace !== record.namespace
			) {
				return false;
			}
			await store.put({ ...current, lastAccessedAt: Date.now() });
			return true;
		});
		handleTransactionSuccess();
		if (isTouched) {
			touchedRecordIds.add(record.id);
		}
	} catch (error) {
		handleTransactionFailure(error);
	} finally {
		touchingRecordIds.delete(record.id);
	}
}

export async function readRecommendationCacheResult<T>(
	storeName: TRecommendationCacheResultStoreName,
	requestKey: string,
	validate: (value: unknown) => T | undefined,
	getLogicalWeight: (result: T) => number
) {
	const database = await getDatabase();
	if (database === undefined) {
		return;
	}
	void ensureOldNamespacesCleaned();
	const { namespace } = getRecommendationCacheContext();
	const id = createRecordId(namespace, storeName, requestKey);
	try {
		const record = await database.get(storeName, id);
		handleTransactionSuccess();
		if (record === undefined) {
			return;
		}
		const result =
			record.recordVersion === RECOMMENDATION_CACHE_RECORD_VERSION &&
			record.namespace === namespace &&
			record.requestKey === requestKey &&
			isNonNegativeSafeInteger(record.createdAt) &&
			isNonNegativeSafeInteger(record.lastAccessedAt) &&
			isPositiveSafeInteger(record.logicalWeight)
				? validate(record.result)
				: undefined;
		if (
			result === undefined ||
			record.logicalWeight !== getLogicalWeight(result)
		) {
			void removeRecord(storeName, record, namespace);
			return;
		}
		void touchRecord(storeName, record);
		return result;
	} catch (error) {
		handleTransactionFailure(error);
		return CACHE_MISS;
	}
}

async function evictCurrentNamespaceRecords(
	transaction: TRecommendationCacheWriteTransaction,
	storeName: TRecommendationCacheResultStoreName,
	metadata: IRecommendationCacheMetadata,
	limits: IRecommendationCacheStoreLimits
) {
	const { namespace } = getRecommendationCacheContext();
	const store = transaction.objectStore(storeName);
	const index = store.index('namespaceLastAccessedAt');
	let cursor = await index.openCursor(
		IDBKeyRange.bound(
			[namespace, Number.NEGATIVE_INFINITY],
			[namespace, Number.POSITIVE_INFINITY]
		)
	);
	while (
		cursor !== null &&
		(metadata.entryCount > limits.maxEntries ||
			metadata.logicalWeight > limits.maxLogicalWeight)
	) {
		metadata.entryCount--;
		metadata.logicalWeight = Math.max(
			0,
			metadata.logicalWeight - getRecordLogicalWeight(cursor.value)
		);
		await cursor.delete();
		cursor = await cursor.continue();
	}
}

async function writeRecordTransaction(
	database: IDBPDatabase<IRecommendationCacheDatabase>,
	storeName: TRecommendationCacheResultStoreName,
	requestKey: string,
	result: unknown,
	logicalWeight: number,
	limits: IRecommendationCacheStoreLimits
) {
	const { namespace } = getRecommendationCacheContext();
	const now = Date.now();
	const id = createRecordId(namespace, storeName, requestKey);
	const transaction = database.transaction(
		[storeName, 'metadata'],
		'readwrite'
	);
	await runTransaction(transaction, async () => {
		const resultStore = transaction.objectStore(storeName);
		const metadataStore = transaction.objectStore('metadata');
		const metadataId = createMetadataId(namespace, storeName);
		const existing = await resultStore.get(id);
		let { metadata } = await readMetadataOrRebuild(
			transaction,
			namespace,
			storeName
		);
		if (existing === undefined) {
			incrementMetadataEntryCount(metadata);
		} else {
			const existingLogicalWeight = getRecordLogicalWeight(existing);
			if (metadata.logicalWeight < existingLogicalWeight) {
				const rebuilt = await readMetadataOrRebuild(
					transaction,
					namespace,
					storeName,
					true
				);
				metadata = rebuilt.metadata;
			}
			metadata.logicalWeight = Math.max(
				0,
				metadata.logicalWeight - existingLogicalWeight
			);
		}
		addMetadataLogicalWeight(metadata, logicalWeight);
		const record: IRecommendationCacheRecord = {
			createdAt: existing?.createdAt ?? now,
			id,
			lastAccessedAt: now,
			logicalWeight,
			namespace,
			recordVersion: RECOMMENDATION_CACHE_RECORD_VERSION,
			requestKey,
			result,
		};
		await resultStore.put(record);
		await evictCurrentNamespaceRecords(
			transaction,
			storeName,
			metadata,
			limits
		);
		await (metadata.entryCount === 0
			? metadataStore.delete(metadataId)
			: metadataStore.put(metadata));
	});
	handleTransactionSuccess();
}

async function evictOldestCurrentRecord(
	database: IDBPDatabase<IRecommendationCacheDatabase>,
	storeName: TRecommendationCacheResultStoreName
) {
	const { namespace } = getRecommendationCacheContext();
	const transaction = database.transaction(
		[storeName, 'metadata'],
		'readwrite'
	);
	await runTransaction(transaction, async () => {
		const cursor = await transaction
			.objectStore(storeName)
			.index('namespaceLastAccessedAt')
			.openCursor(
				IDBKeyRange.bound(
					[namespace, Number.NEGATIVE_INFINITY],
					[namespace, Number.POSITIVE_INFINITY]
				)
			);
		if (cursor !== null) {
			const record = cursor.value;
			await cursor.delete();
			await updateMetadataForDeletedRecords(transaction, [
				{ logicalWeight: record.logicalWeight, namespace, storeName },
			]);
		}
	});
	handleTransactionSuccess();
}

export async function writeRecommendationCacheResult(
	storeName: TRecommendationCacheResultStoreName,
	requestKey: string,
	result: unknown,
	logicalWeight: number,
	limits: IRecommendationCacheStoreLimits
) {
	if (
		isWriteDisabled ||
		!isPositiveSafeInteger(logicalWeight) ||
		!isPositiveSafeInteger(limits.maxEntries) ||
		!isPositiveSafeInteger(limits.maxLogicalWeight) ||
		logicalWeight > limits.maxLogicalWeight
	) {
		return false;
	}
	await ensureOldNamespacesCleaned();
	const database = await getDatabase();
	if (database === undefined) {
		return false;
	}
	try {
		await writeRecordTransaction(
			database,
			storeName,
			requestKey,
			result,
			logicalWeight,
			limits
		);
		return true;
	} catch (error) {
		if (!isQuotaExceededError(error)) {
			handleTransactionFailure(error);
			return false;
		}
		try {
			await ensureOldNamespacesCleaned(true);
			await evictOldestCurrentRecord(database, storeName);
			await writeRecordTransaction(
				database,
				storeName,
				requestKey,
				result,
				logicalWeight,
				limits
			);
			return true;
		} catch (retryError) {
			console.warn('Recommendation cache quota retry failed.', {
				errorCode: getLogSafeErrorCode(retryError),
			});
			disableWrites();
			return false;
		}
	}
}

export async function getRecommendationCacheStoreStats(
	storeName: TRecommendationCacheResultStoreName
): Promise<IRecommendationCacheStoreStats> {
	const database = await getDatabase();
	if (database === undefined) {
		return { entryCount: 0, logicalWeight: 0 };
	}
	const { namespace } = getRecommendationCacheContext();
	try {
		const transaction = database.transaction(
			[storeName, 'metadata'],
			'readwrite'
		);
		const metadata = await runTransaction(transaction, async () => {
			const result = await readMetadataOrRebuild(
				transaction,
				namespace,
				storeName
			);
			if (result.isRebuilt) {
				await (result.metadata.entryCount === 0
					? transaction
							.objectStore('metadata')
							.delete(result.metadata.id)
					: transaction.objectStore('metadata').put(result.metadata));
			}
			return result.metadata;
		});
		handleTransactionSuccess();
		return {
			entryCount: metadata.entryCount,
			logicalWeight: metadata.logicalWeight,
		};
	} catch (error) {
		handleTransactionFailure(error);
		return { entryCount: 0, logicalWeight: 0 };
	}
}

export function closeRecommendationCacheDatabase() {
	openedDatabase?.close();
	openedDatabase = undefined;
	databasePromise = undefined;
}

export async function deleteCurrentRecommendationCacheDatabase() {
	const databaseName = getRecommendationCacheDatabaseName();
	closeRecommendationCacheDatabase();
	try {
		await deleteDB(databaseName, {
			blocked() {
				console.warn('Recommendation cache database deletion blocked.');
			},
		});
		touchedRecordIds.clear();
		touchingRecordIds.clear();
		isCacheDisabled = false;
		isWriteDisabled = false;
		isOldNamespaceCleanupComplete = false;
		transactionFailureCount = 0;
		return true;
	} catch (error) {
		console.warn('Recommendation cache database deletion failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return false;
	}
}
