// Server-side legacy backup import orchestration.
import { type Kysely, type Transaction } from 'kysely';
import isObject from 'lodash/isObject.js';

import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
	USER_STATUS_MAP,
} from '@/domain/account/contracts';
import type {
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import { MAX_BACKUP_DATA_BYTES } from '@/features/account/requestLimits';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import {
	SYNC_SCHEMA_VERSION_MAP,
	checkSupportedSyncSchemaVersion,
} from '@/features/account/sync/constants';
import {
	checkKnownSyncNamespace,
	normalizeSyncStateData,
} from '@/features/account/sync/normalizeSyncStateData';
import { type TMealSnapshot } from '@/features/account/sync/serializers/meals';
import {
	migrateUnversionedNormalGuestMealsSnapshot,
	migrateUnversionedSpecialGuestMealsSnapshot,
} from '@/features/account/sync/serializers/savedMealsMigration';
import { stableJson } from '@/features/account/sync/serializers/utils';
import {
	compatibilitySpecialGuestData,
	deleteIndexProperty,
} from '@/features/legacyBackup/legacyPayload';
import { type IBackupCodeLockSignal } from '@/features/legacyBackup/server/backupCodeLock';
import { maskBackupCode } from '@/features/legacyBackup/server/logging';
import {
	checkBackupFileNotFoundError,
	deleteFile,
	getFile,
	getFileSize,
} from '@/features/legacyBackup/server/persistence/backupFileRepository';

import type {
	TDatabase,
	TSession,
	TUserState,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	canAddNonNegativeSafeIntegers,
	canIncrementNonNegativeSafeInteger,
} from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	AccountSyncCapacityExceededError,
	calculateAccountSyncCapacity,
	checkAccountSyncCapacityAllowed,
	getAccountSyncCapacityConfiguration,
} from './capacity';

type TMealSyncNamespace =
	| typeof SYNC_NAMESPACE_MAP.normalGuestMeals
	| typeof SYNC_NAMESPACE_MAP.specialGuestMeals;

type TImportMealSnapshot = TMealSnapshot<
	INormalGuestSavedMeal | ISpecialGuestSavedMeal
>;

interface ILegacyImportNamespaceData {
	data: Record<string, object[]>;
	namespace: TMealSyncNamespace;
}

interface IImportNamespaceData {
	data: TImportMealSnapshot;
	namespace: TMealSyncNamespace;
}

interface IImportBackupResult {
	namespace: TSyncNamespace;
	revision: number;
	status: 'ok';
}

type TBackupLockModule =
	typeof import('@/features/legacyBackup/server/backupCodeLock');

function canIncrementSyncRevision(value: unknown): value is number {
	return canAddNonNegativeSafeIntegers(value, 2);
}

function parseImportBackupResults(data: string) {
	let parsedData: unknown;
	try {
		parsedData = JSON.parse(data);
	} catch {
		return null;
	}

	if (
		!Array.isArray(parsedData) ||
		!parsedData.every(
			(item): item is IImportBackupResult =>
				isObjectTagRecord(item) &&
				item['status'] === 'ok' &&
				checkKnownSyncNamespace(item['namespace']) &&
				canIncrementNonNegativeSafeInteger(item['revision'])
		)
	) {
		return null;
	}

	return parsedData;
}

async function getBackupImportResult(
	database: Kysely<TDatabase>,
	userId: string,
	code: string,
	expectedStateEpoch: number
) {
	const record = await database
		.selectFrom(TABLE_NAME_MAP.backupImportRecord)
		.select(['file_name', 'results'])
		.where('code', '=', code)
		.where('user_id', '=', userId)
		.where('state_epoch', '=', expectedStateEpoch)
		.executeTakeFirst();
	if (record === undefined) {
		return null;
	}

	const results = parseImportBackupResults(record.results);
	if (results === null) {
		throw new Error('server-misconfigured');
	}

	return {
		fileName: record.file_name,
		results,
		status: 'already-imported' as const,
	};
}

function checkMealRecord(value: unknown): value is Record<string, object[]> {
	return (
		isObject(value) &&
		Object.values(value).every(
			(meals) =>
				Array.isArray(meals) && meals.every((meal) => isObject(meal))
		)
	);
}
function normalizeBackupData(
	data: unknown
): ILegacyImportNamespaceData[] | null {
	if (!isObject(data)) {
		return null;
	}

	if ('customer_normal' in data || 'customer_rare' in data) {
		const backupData = data as Partial<{
			customer_normal: unknown;
			customer_rare: unknown;
		}>;
		if (
			!checkMealRecord(backupData.customer_normal) ||
			!checkMealRecord(backupData.customer_rare)
		) {
			return null;
		}

		deleteIndexProperty(backupData.customer_normal);
		deleteIndexProperty(backupData.customer_rare);
		compatibilitySpecialGuestData(backupData.customer_rare);

		return [
			{
				data: backupData.customer_normal,
				namespace: SYNC_NAMESPACE_MAP.normalGuestMeals,
			},
			{
				data: backupData.customer_rare,
				namespace: SYNC_NAMESPACE_MAP.specialGuestMeals,
			},
		];
	}

	if (!checkMealRecord(data)) {
		return null;
	}

	deleteIndexProperty(data);
	compatibilitySpecialGuestData(data);

	return [{ data, namespace: SYNC_NAMESPACE_MAP.specialGuestMeals }];
}

function normalizeLegacyBackupMealData(
	data: unknown
): IImportNamespaceData[] | null {
	const namespaceData = normalizeBackupData(data);
	if (namespaceData === null) {
		return null;
	}

	try {
		return namespaceData.map(({ data: legacyData, namespace }) => ({
			data:
				namespace === SYNC_NAMESPACE_MAP.normalGuestMeals
					? migrateUnversionedNormalGuestMealsSnapshot(legacyData)
					: migrateUnversionedSpecialGuestMealsSnapshot(legacyData),
			namespace,
		}));
	} catch {
		return null;
	}
}

function createMealSignature(meal: object) {
	return stableJson(meal);
}

function createMealSignatureCountMap(meals: object[]) {
	return meals.reduce<Map<string, number>>((result, meal) => {
		const signature = createMealSignature(meal);
		result.set(signature, (result.get(signature) ?? 0) + 1);

		return result;
	}, new Map());
}

function mergeMealRecord(
	cloud: TImportMealSnapshot | null,
	imported: TImportMealSnapshot
) {
	const result: TImportMealSnapshot = cloud === null ? {} : { ...cloud };

	Object.entries(imported).forEach(([guestKey, importedMeals]) => {
		const cloudMeals = result[guestKey] ?? [];
		const signatureCountMap = createMealSignatureCountMap(cloudMeals);
		const additions = importedMeals.filter((meal) => {
			const signature = createMealSignature(meal);
			const remainingCount = signatureCountMap.get(signature) ?? 0;
			if (remainingCount > 0) {
				if (remainingCount === 1) {
					signatureCountMap.delete(signature);
				} else {
					signatureCountMap.set(signature, remainingCount - 1);
				}

				return false;
			}

			return true;
		});

		result[guestKey] = [...cloudMeals, ...additions];
	});

	return result;
}

function normalizeCloudMealRecordForImport(
	record: Pick<TUserState, 'data' | 'schema_version'> | null,
	namespace: TMealSyncNamespace
) {
	if (record === null) {
		return null;
	}
	if (!checkSupportedSyncSchemaVersion(namespace, record.schema_version)) {
		throw new Error('server-misconfigured');
	}

	let data: unknown;
	try {
		data = JSON.parse(record.data);
	} catch {
		throw new Error('server-misconfigured');
	}
	const normalized = normalizeSyncStateData({
		data,
		namespace,
		revision: 0,
		schema_version: record.schema_version,
	});
	if (normalized.status !== 'accepted') {
		throw new Error('server-misconfigured');
	}
	return normalized.data as TImportMealSnapshot;
}

async function checkImportBackupDataPreconditions(
	database: Kysely<TDatabase>,
	userId: string,
	code: string,
	expectedStateEpoch: number,
	expectedSyncGeneration: number,
	session: Pick<TSession, 'id' | 'token_hash'>,
	signal: IBackupCodeLockSignal,
	lockModule: TBackupLockModule
) {
	lockModule.throwIfBackupCodeLockLost(signal);

	const user = await database
		.selectFrom(TABLE_NAME_MAP.user)
		.select(['state_epoch', 'status', 'sync_generation', 'sync_status'])
		.where('id', '=', userId)
		.executeTakeFirst();
	lockModule.throwIfBackupCodeLockLost(signal);
	if (user?.status !== USER_STATUS_MAP.active) {
		throw new Error('unauthorized');
	}

	if (user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return {
			state_epoch: user.state_epoch,
			status: 'sync-paused' as const,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		};
	}
	if (user.state_epoch !== expectedStateEpoch) {
		return {
			state_epoch: user.state_epoch,
			status: 'state-epoch-mismatch' as const,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		};
	}
	if (user.sync_generation !== expectedSyncGeneration) {
		return {
			state_epoch: user.state_epoch,
			status: 'sync-generation-mismatch' as const,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		};
	}

	const currentSession = await database
		.selectFrom(TABLE_NAME_MAP.session)
		.select('id')
		.where('id', '=', session.id)
		.where('user_id', '=', userId)
		.where('token_hash', '=', session.token_hash)
		.executeTakeFirst();
	lockModule.throwIfBackupCodeLockLost(signal);
	if (currentSession === undefined) {
		throw new Error('unauthorized');
	}

	const backupRecord = await database
		.selectFrom(TABLE_NAME_MAP.backupFileRecord)
		.select(['code', 'file_name'])
		.where('code', '=', code)
		.executeTakeFirst();
	lockModule.throwIfBackupCodeLockLost(signal);

	return backupRecord === undefined
		? ((await getBackupImportResult(
				database,
				userId,
				code,
				expectedStateEpoch
			)) ?? { status: 'not-found' as const })
		: { fileName: backupRecord.file_name, status: 'ok' as const };
}

async function readImportBackupFile(
	code: string,
	fileName: string | null,
	signal: IBackupCodeLockSignal,
	lockModule: TBackupLockModule
) {
	let fileContent: string;
	try {
		if (
			(await getFileSize(code, fileName)) > BigInt(MAX_BACKUP_DATA_BYTES)
		) {
			throw new Error('invalid-backup-file');
		}
		lockModule.throwIfBackupCodeLockLost(signal);

		fileContent = await getFile(code, fileName);
		lockModule.throwIfBackupCodeLockLost(signal);
	} catch (error) {
		if (
			Error.isError(error) &&
			(error.message === 'invalid-backup-file' ||
				error.message === 'backup-code-lock-lost')
		) {
			throw error;
		}
		if (checkBackupFileNotFoundError(error)) {
			throw new Error('backup-code-not-found');
		}
		throw new Error('server-misconfigured');
	}

	let fileData: unknown;
	try {
		fileData = JSON.parse(fileContent);
	} catch {
		throw new Error('invalid-backup-file');
	}

	const namespaceData = normalizeLegacyBackupMealData(fileData);
	if (namespaceData === null) {
		throw new Error('invalid-backup-file');
	}

	return namespaceData;
}

export async function importBackupData({
	code,
	expectedStateEpoch,
	expectedSyncGeneration,
	lockModule,
	session,
	signal,
	userId,
	writeAuditLog,
}: {
	code: string;
	expectedStateEpoch: number;
	expectedSyncGeneration: number;
	lockModule: TBackupLockModule;
	session: Pick<TSession, 'id' | 'token_hash'>;
	signal: IBackupCodeLockSignal;
	userId: string;
	writeAuditLog: (
		trx: Transaction<TDatabase>,
		now: number,
		result: { namespaceCount: number; stateEpoch: number }
	) => Promise<void>;
}) {
	const database = await getAccountDatabase();
	const preflightResult = await checkImportBackupDataPreconditions(
		database,
		userId,
		code,
		expectedStateEpoch,
		expectedSyncGeneration,
		session,
		signal,
		lockModule
	);
	if (preflightResult.status !== 'ok') {
		return preflightResult;
	}

	const importNamespaceData = await readImportBackupFile(
		code,
		preflightResult.fileName,
		signal,
		lockModule
	);

	return lockModule.withFreshBackupCodeLock(signal, async (trx) => {
		lockModule.throwIfBackupCodeLockLost(signal);

		const user = await trx
			.selectFrom(TABLE_NAME_MAP.user)
			.select(['state_epoch', 'status', 'sync_generation', 'sync_status'])
			.where('id', '=', userId)
			.executeTakeFirst();
		lockModule.throwIfBackupCodeLockLost(signal);
		if (user?.status !== USER_STATUS_MAP.active) {
			throw new Error('unauthorized');
		}

		if (user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
			return {
				state_epoch: user.state_epoch,
				status: 'sync-paused' as const,
				sync_generation: user.sync_generation,
				sync_status: user.sync_status,
			};
		}
		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch' as const,
				sync_generation: user.sync_generation,
				sync_status: user.sync_status,
			};
		}
		if (user.sync_generation !== expectedSyncGeneration) {
			return {
				state_epoch: user.state_epoch,
				status: 'sync-generation-mismatch' as const,
				sync_generation: user.sync_generation,
				sync_status: user.sync_status,
			};
		}

		const currentSession = await trx
			.selectFrom(TABLE_NAME_MAP.session)
			.select('id')
			.where('id', '=', session.id)
			.where('user_id', '=', userId)
			.where('token_hash', '=', session.token_hash)
			.executeTakeFirst();
		lockModule.throwIfBackupCodeLockLost(signal);
		if (currentSession === undefined) {
			throw new Error('unauthorized');
		}

		const backupRecordDeleteQuery = trx
			.deleteFrom(TABLE_NAME_MAP.backupFileRecord)
			.where('code', '=', code);
		const backupRecord = await (
			preflightResult.fileName === null
				? backupRecordDeleteQuery.where('file_name', 'is', null)
				: backupRecordDeleteQuery.where(
						'file_name',
						'=',
						preflightResult.fileName
					)
		)
			.returning('code')
			.executeTakeFirst();
		lockModule.throwIfBackupCodeLockLost(signal);

		if (backupRecord === undefined) {
			const currentBackupRecord = await trx
				.selectFrom(TABLE_NAME_MAP.backupFileRecord)
				.select('code')
				.where('code', '=', code)
				.executeTakeFirst();
			lockModule.throwIfBackupCodeLockLost(signal);

			if (currentBackupRecord !== undefined) {
				throw new Error('backup-code-lock-lost');
			}

			return (
				(await getBackupImportResult(
					trx,
					userId,
					code,
					expectedStateEpoch
				)) ?? { status: 'not-found' as const }
			);
		}

		const currentEntries = await trx
			.selectFrom(TABLE_NAME_MAP.userState)
			.selectAll()
			.where('user_id', '=', userId)
			.execute();
		const currentEntryMap = new Map(
			currentEntries.map((entry) => [entry.namespace, entry])
		);
		const preparedEntries = importNamespaceData.map((item) => {
			lockModule.throwIfBackupCodeLockLost(signal);

			const current = currentEntryMap.get(item.namespace);
			if (
				current !== undefined &&
				!canIncrementSyncRevision(current.revision)
			) {
				throw new Error('server-misconfigured');
			}

			const revision = (current?.revision ?? 0) + 1;
			const updatedAt = Math.max(
				Date.now(),
				(current?.updated_at ?? 0) + 1
			);
			const mergedData = mergeMealRecord(
				normalizeCloudMealRecordForImport(
					current ?? null,
					item.namespace
				),
				item.data
			);
			return {
				current,
				entry: {
					data: JSON.stringify(mergedData),
					namespace: item.namespace,
					revision,
					schema_version: SYNC_SCHEMA_VERSION_MAP[item.namespace],
					updated_at: updatedAt,
					user_id: userId,
				},
			};
		});
		const capacityConfiguration = getAccountSyncCapacityConfiguration();
		const capacity = calculateAccountSyncCapacity({
			currentEntries,
			replacements: preparedEntries.map(({ entry }) => entry),
		});
		if (
			!checkAccountSyncCapacityAllowed({
				candidateBytes: capacity.candidateBytes,
				currentBytes: capacity.currentBytes,
				limitBytes: capacityConfiguration.stateTotalMaxBytes,
			})
		) {
			throw new AccountSyncCapacityExceededError({
				candidateBytes: capacity.candidateBytes,
				currentBytes: capacity.currentBytes,
				limitBytes: capacityConfiguration.stateTotalMaxBytes,
				namespaces: preparedEntries.map(({ entry }) => entry.namespace),
			});
		}

		const results: IImportBackupResult[] = [];
		for (const { current, entry } of preparedEntries) {
			lockModule.throwIfBackupCodeLockLost(signal);
			if (current === undefined) {
				const insertResult = await trx
					.insertInto(TABLE_NAME_MAP.userState)
					.values(entry)
					.onConflict((oc) =>
						oc.columns(['user_id', 'namespace']).doNothing()
					)
					.executeTakeFirst();

				if (insertResult.numInsertedOrUpdatedRows !== 1n) {
					throw new Error('sync-conflict');
				}
			} else {
				const updateResult = await trx
					.updateTable(TABLE_NAME_MAP.userState)
					.set({
						data: entry.data,
						revision: entry.revision,
						schema_version: entry.schema_version,
						updated_at: entry.updated_at,
					})
					.where('user_id', '=', userId)
					.where('namespace', '=', entry.namespace)
					.where('revision', '=', current.revision)
					.executeTakeFirst();

				if (updateResult.numUpdatedRows !== 1n) {
					throw new Error('sync-conflict');
				}
			}

			results.push({
				namespace: entry.namespace,
				revision: entry.revision,
				status: 'ok' as const,
			});
		}

		const importedAt = Date.now();
		await trx
			.insertInto(TABLE_NAME_MAP.backupImportRecord)
			.values({
				code,
				created_at: importedAt,
				file_name: preflightResult.fileName,
				results: JSON.stringify(results),
				state_epoch: expectedStateEpoch,
				user_id: userId,
			})
			.execute();
		await writeAuditLog(trx, importedAt, {
			namespaceCount: results.length,
			stateEpoch: expectedStateEpoch,
		});
		lockModule.throwIfBackupCodeLockLost(signal);

		return {
			fileName: preflightResult.fileName,
			results,
			status: 'ok' as const,
		};
	});
}

export async function cleanupImportedBackupFile(
	code: string,
	fileName: string | null
) {
	try {
		await deleteFile(code, fileName);
	} catch (error) {
		if (!checkBackupFileNotFoundError(error)) {
			console.warn('Failed to delete imported backup file.', {
				codeHash: maskBackupCode(code),
				errorCode: getLogSafeErrorCode(error),
			});
		}
	}
}
