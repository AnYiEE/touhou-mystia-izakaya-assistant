import { type Kysely } from 'kysely';

import {
	compatibilityCustomerRareData,
	deleteIndexProperty,
} from '@/actions/backup/compatibility';
import {
	checkBackupFileNotFoundError,
	deleteFile,
	getFile,
	getFileSize,
} from '@/actions/backup/file';
import { type IBackupCodeLockSignal } from '@/actions/backup/lock';
import {
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
	checkSupportedSyncSchemaVersion,
} from '@/lib/account/sync';
import {
	checkBeverageName,
	validateMealRecipe,
	validateMealSnapshot,
} from '@/lib/account/sync/serializers/meals';
import {
	checkBeverageTag,
	checkRecipeTag,
} from '@/lib/account/sync/serializers/tags';
import {
	isNonNegativeSafeInteger,
	isPlainObject,
} from '@/lib/account/sync/serializers/utils';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { MAX_BACKUP_DATA_BYTES } from '@/lib/account/shared/requestLimits';
import { getAccountDatabase } from '@/lib/account/server/db';
import { maskBackupCode } from '@/lib/account/server/backupCode';
import {
	AccountSyncCapacityExceededError,
	calculateAccountSyncCapacity,
	checkAccountSyncCapacityAllowed,
	getAccountSyncCapacityConfiguration,
} from '@/lib/account/server/syncCapacity';
import { TABLE_NAME_MAP } from '@/lib/db';
import { type TDatabase, type TSession, type TUserState } from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

interface IImportNamespaceData {
	data: Record<string, object[]>;
	namespace: TSyncNamespace;
}

interface IImportBackupResult {
	namespace: TSyncNamespace;
	revision: number;
	status: 'ok';
}

type TBackupLockModule = typeof import('@/actions/backup/lock');

const syncNamespaceSet = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);

function checkSyncNamespaceValue(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		syncNamespaceSet.has(value as TSyncNamespace)
	);
}

function canIncrementSyncRevision(value: unknown): value is number {
	return (
		isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER - 1
	);
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
				isPlainObject(item) &&
				item['status'] === 'ok' &&
				checkSyncNamespaceValue(item['namespace']) &&
				isNonNegativeSafeInteger(item['revision']) &&
				item['revision'] < Number.MAX_SAFE_INTEGER
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

function normalizeMealRecipe(data: unknown) {
	if (!validateMealRecipe(data)) {
		return null;
	}

	return { extraIngredients: [...data.extraIngredients], name: data.name };
}

function checkMealRecord(value: unknown): value is Record<string, object[]> {
	return (
		value !== null &&
		typeof value === 'object' &&
		Object.values(value).every(
			(meals) =>
				Array.isArray(meals) &&
				meals.every((meal) => meal !== null && typeof meal === 'object')
		)
	);
}

function validateCustomerNormalMeal(
	data: unknown
): data is Record<string, unknown> {
	return (
		isPlainObject(data) &&
		(data['beverage'] === null || checkBeverageName(data['beverage'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function normalizeCustomerNormalMeal(data: unknown) {
	if (!validateCustomerNormalMeal(data)) {
		return null;
	}

	const recipe = normalizeMealRecipe(data['recipe']);
	if (recipe === null) {
		return null;
	}

	return { beverage: data['beverage'], recipe };
}

function validateCustomerRareMeal(
	data: unknown
): data is Record<string, unknown> {
	return (
		isPlainObject(data) &&
		checkBeverageName(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isPlainObject(data['order']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkRecipeTag(data['order']['recipeTag'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function normalizeCustomerRareMeal(data: unknown) {
	if (!validateCustomerRareMeal(data)) {
		return null;
	}

	const recipe = normalizeMealRecipe(data['recipe']);
	if (recipe === null || !isPlainObject(data['order'])) {
		return null;
	}

	return {
		beverage: data['beverage'],
		hasMystiaCooker: data['hasMystiaCooker'],
		order: {
			beverageTag: data['order']['beverageTag'],
			recipeTag: data['order']['recipeTag'],
		},
		recipe,
	};
}

function normalizeMealRecord(
	data: Record<string, object[]>,
	normalizeMeal: (data: unknown) => object | null
) {
	return Object.entries(data).reduce<Record<string, object[]> | null>(
		(result, [customerName, meals]) => {
			if (result === null) {
				return null;
			}

			const normalizedMeals = meals.map(normalizeMeal);
			if (normalizedMeals.includes(null)) {
				return null;
			}

			result[customerName] = normalizedMeals as object[];
			return result;
		},
		{}
	);
}

function validateImportNamespaceData(item: IImportNamespaceData) {
	if (item.namespace === SYNC_NAMESPACE_MAP.customerNormalMeals) {
		return validateMealSnapshot(item.data, {
			customerType: 'normal',
			validateMeal: validateCustomerNormalMeal,
		});
	}

	return validateMealSnapshot(item.data, {
		customerType: 'rare',
		validateMeal: validateCustomerRareMeal,
	});
}

function normalizeImportNamespaceData(item: IImportNamespaceData) {
	if (!validateImportNamespaceData(item)) {
		return null;
	}

	const data = normalizeMealRecord(
		item.data,
		item.namespace === SYNC_NAMESPACE_MAP.customerNormalMeals
			? normalizeCustomerNormalMeal
			: normalizeCustomerRareMeal
	);

	return data === null ? null : { ...item, data };
}

function normalizeBackupData(data: unknown): IImportNamespaceData[] | null {
	if (data === null || typeof data !== 'object') {
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
		compatibilityCustomerRareData(backupData.customer_rare);

		return [
			{
				data: backupData.customer_normal,
				namespace: SYNC_NAMESPACE_MAP.customerNormalMeals,
			},
			{
				data: backupData.customer_rare,
				namespace: SYNC_NAMESPACE_MAP.customerRareMeals,
			},
		];
	}

	if (!checkMealRecord(data)) {
		return null;
	}

	deleteIndexProperty(data);
	compatibilityCustomerRareData(data);

	return [{ data, namespace: SYNC_NAMESPACE_MAP.customerRareMeals }];
}

function sortJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortJsonValue);
	}
	if (value !== null && typeof value === 'object') {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const object = value as Record<string, unknown>;
				if (object[key] !== undefined) {
					result[key] = sortJsonValue(object[key]);
				}
				return result;
			}, {});
	}

	return value;
}

function createMealSignature(meal: object) {
	return JSON.stringify(sortJsonValue(meal));
}

function createMealSignatureCountMap(meals: object[]) {
	return meals.reduce<Map<string, number>>((result, meal) => {
		const signature = createMealSignature(meal);
		result.set(signature, (result.get(signature) ?? 0) + 1);

		return result;
	}, new Map());
}

function mergeMealRecord(
	cloud: Record<string, object[]> | null,
	imported: Record<string, object[]>
) {
	const result: Record<string, object[]> = cloud === null ? {} : { ...cloud };

	Object.entries(imported).forEach(([customerName, importedMeals]) => {
		const cloudMeals = result[customerName] ?? [];
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

		result[customerName] = [...cloudMeals, ...additions];
	});

	return result;
}

function parseCloudMealRecord(
	record: TUserState | null,
	namespace: TSyncNamespace
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
	if (!checkMealRecord(data)) {
		throw new Error('server-misconfigured');
	}

	const normalized = normalizeImportNamespaceData({ data, namespace });
	if (normalized === null) {
		throw new Error('server-misconfigured');
	}

	return normalized.data;
}

async function checkImportBackupDataPreconditions(
	database: Kysely<TDatabase>,
	userId: string,
	code: string,
	expectedStateEpoch: number,
	session: Pick<TSession, 'id' | 'token_hash'>,
	signal: IBackupCodeLockSignal,
	lockModule: TBackupLockModule
) {
	lockModule.throwIfBackupCodeLockLost(signal);

	const user = await database
		.selectFrom(TABLE_NAME_MAP.user)
		.select(['state_epoch', 'status'])
		.where('id', '=', userId)
		.executeTakeFirst();
	lockModule.throwIfBackupCodeLockLost(signal);
	if (user?.status !== USER_STATUS_MAP.active) {
		throw new Error('unauthorized');
	}

	if (user.state_epoch !== expectedStateEpoch) {
		return {
			state_epoch: user.state_epoch,
			status: 'state-epoch-mismatch' as const,
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
			error instanceof Error &&
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

	const namespaceData = normalizeBackupData(fileData)?.map(
		normalizeImportNamespaceData
	);
	if (namespaceData === undefined || namespaceData.includes(null)) {
		throw new Error('invalid-backup-file');
	}

	return namespaceData.filter(
		(item): item is IImportNamespaceData => item !== null
	);
}

export async function importBackupData({
	code,
	expectedStateEpoch,
	lockModule,
	session,
	signal,
	userId,
}: {
	code: string;
	expectedStateEpoch: number;
	lockModule: TBackupLockModule;
	session: Pick<TSession, 'id' | 'token_hash'>;
	signal: IBackupCodeLockSignal;
	userId: string;
}) {
	const database = await getAccountDatabase();
	const preflightResult = await checkImportBackupDataPreconditions(
		database,
		userId,
		code,
		expectedStateEpoch,
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
			.select(['state_epoch', 'status'])
			.where('id', '=', userId)
			.executeTakeFirst();
		lockModule.throwIfBackupCodeLockLost(signal);
		if (user?.status !== USER_STATUS_MAP.active) {
			throw new Error('unauthorized');
		}

		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch' as const,
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
				parseCloudMealRecord(current ?? null, item.namespace),
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

		await trx
			.insertInto(TABLE_NAME_MAP.backupImportRecord)
			.values({
				code,
				created_at: Date.now(),
				file_name: preflightResult.fileName,
				results: JSON.stringify(results),
				state_epoch: expectedStateEpoch,
				user_id: userId,
			})
			.execute();
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
