import { type Kysely } from 'kysely';
import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

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
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { getLogSafeErrorCode, maskBackupCode } from '@/api/v1/backups/utils';
import { MAX_DATA_SIZE } from '@/api/v1/backups/constants';
import {
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import {
	checkBeverageName,
	validateMealRecipe,
	validateMealSnapshot,
} from '@/lib/account/sync/serializers/meals';
import {
	checkBeverageTag,
	checkRecipeTag,
} from '@/lib/account/sync/serializers/tags';
import { isPlainObject } from '@/lib/account/sync/serializers/utils';
import { TABLE_NAME_MAP } from '@/lib/db';
import { type TDatabase, type TSession, type TUserState } from '@/lib/db/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody {
	code: string;
}

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

function isNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
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
	if (record.schema_version !== SYNC_SCHEMA_VERSION_MAP[namespace]) {
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
		if ((await getFileSize(code, fileName)) > BigInt(MAX_DATA_SIZE)) {
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

async function importBackupData(
	database: Kysely<TDatabase>,
	userId: string,
	code: string,
	expectedStateEpoch: number,
	session: Pick<TSession, 'id' | 'token_hash'>,
	signal: IBackupCodeLockSignal,
	lockModule: TBackupLockModule
) {
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

		const results: IImportBackupResult[] = [];
		for (const item of importNamespaceData) {
			lockModule.throwIfBackupCodeLockLost(signal);

			const current = await trx
				.selectFrom(TABLE_NAME_MAP.userState)
				.selectAll()
				.where('user_id', '=', userId)
				.where('namespace', '=', item.namespace)
				.executeTakeFirst();
			if (
				current !== undefined &&
				!canIncrementSyncRevision(current.revision)
			) {
				throw new Error('server-misconfigured');
			}

			const revision = (current?.revision ?? 0) + 1;
			const updatedAt = Date.now();
			const mergedData = mergeMealRecord(
				parseCloudMealRecord(current ?? null, item.namespace),
				item.data
			);

			if (current === undefined) {
				const insertResult = await trx
					.insertInto(TABLE_NAME_MAP.userState)
					.values({
						data: JSON.stringify(mergedData),
						namespace: item.namespace,
						revision,
						schema_version: SYNC_SCHEMA_VERSION_MAP[item.namespace],
						updated_at: updatedAt,
						user_id: userId,
					})
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
						data: JSON.stringify(mergedData),
						revision,
						schema_version: SYNC_SCHEMA_VERSION_MAP[item.namespace],
						updated_at: updatedAt,
					})
					.where('user_id', '=', userId)
					.where('namespace', '=', item.namespace)
					.where('revision', '=', current.revision)
					.executeTakeFirst();

				if (updateResult.numUpdatedRows !== 1n) {
					throw new Error('sync-conflict');
				}
			}

			results.push({
				namespace: item.namespace,
				revision,
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

async function cleanupImportedBackupFile(
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

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'import-backup-code'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const bodyResult = await readJsonBodyResult<IImportBackupCodeBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const rawCode = typeof body?.code === 'string' ? body.code.trim() : '';
	if (rawCode === '' || !validate(rawCode)) {
		return createNoStoreErrorResponse('invalid-backup-code', 400);
	}
	const code = rawCode.toLowerCase();

	const [authModule, dbModule, lockModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/db'),
		import('@/actions/backup/lock'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	try {
		let importedBackupFileName: string | null | undefined;
		const response = await lockModule.withBackupCodeLock(
			code,
			async (signal) => {
				const database = await dbModule.getAccountDatabase();
				let importResult;
				try {
					importResult = await importBackupData(
						database,
						auth.data.user.id,
						code,
						auth.data.user.state_epoch,
						auth.data.session,
						signal,
						lockModule
					);
				} catch (error) {
					if (
						error instanceof Error &&
						error.message === 'unauthorized'
					) {
						return createNoStoreErrorResponse('unauthorized', 401);
					}
					if (
						error instanceof Error &&
						error.message === 'backup-code-not-found'
					) {
						return createNoStoreErrorResponse(
							'backup-code-not-found',
							404
						);
					}
					if (
						error instanceof Error &&
						error.message === 'invalid-backup-file'
					) {
						return createNoStoreErrorResponse(
							'invalid-backup-file',
							400
						);
					}
					if (
						error instanceof Error &&
						error.message === 'server-misconfigured'
					) {
						return createNoStoreErrorResponse(
							'server-misconfigured',
							500
						);
					}
					if (
						error instanceof Error &&
						error.message === 'sync-conflict'
					) {
						return createNoStoreErrorResponse('sync-conflict', 409);
					}
					if (
						error instanceof Error &&
						error.message === 'backup-code-lock-lost'
					) {
						return createNoStoreErrorResponse(
							'backup-code-lock-lost',
							409
						);
					}
					throw error;
				}
				if (importResult.status === 'not-found') {
					return createNoStoreErrorResponse(
						'backup-code-not-found',
						404
					);
				}
				if (importResult.status === 'state-epoch-mismatch') {
					return createNoStoreErrorResponse(
						'state-epoch-mismatch',
						409,
						{ state_epoch: importResult.state_epoch }
					);
				}
				if (importResult.status === 'already-imported') {
					return createNoStoreErrorResponse(
						'backup-code-already-imported',
						409
					);
				}

				lockModule.markBackupCodeLockCommitted(signal);
				importedBackupFileName = importResult.fileName;

				return createNoStoreJsonResponse({
					results: importResult.results,
				});
			}
		);
		if (importedBackupFileName !== undefined) {
			void cleanupImportedBackupFile(code, importedBackupFileName);
		}

		return response;
	} catch (error) {
		if (lockModule.checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		}
		if (lockModule.checkBackupCodeLockTimeoutError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-timeout', 409);
		}

		throw error;
	}
}
