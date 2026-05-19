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
import {
	type IBackupCodeLockSignal,
	checkBackupCodeLockLostError,
	markBackupCodeLockCommitted,
	throwIfBackupCodeLockLost,
	withBackupCodeLock,
} from '@/actions/backup/lock';
import {
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { MAX_DATA_SIZE } from '@/api/v1/backups/constants';
import { maskBackupCode } from '@/api/v1/backups/utils';
import {
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
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
import { isPlainObject } from '@/lib/account/sync/serializers/utils';
import { TABLE_NAME_MAP } from '@/lib/db';
import { type TDatabase, type TUserState } from '@/lib/db/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody {
	code: string;
}

interface IImportNamespaceData {
	data: Record<string, object[]>;
	namespace: TSyncNamespace;
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

async function importBackupData(
	database: Kysely<TDatabase>,
	userId: string,
	code: string,
	expectedStateEpoch: number,
	signal: IBackupCodeLockSignal
) {
	return database.transaction().execute(async (trx) => {
		throwIfBackupCodeLockLost(signal);

		const user = await trx
			.selectFrom(TABLE_NAME_MAP.user)
			.select('state_epoch')
			.where('id', '=', userId)
			.executeTakeFirst();
		throwIfBackupCodeLockLost(signal);
		if (user === undefined) {
			throw new Error('unauthorized');
		}

		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch' as const,
			};
		}

		const backupRecord = await trx
			.deleteFrom(TABLE_NAME_MAP.backupFileRecord)
			.where('code', '=', code)
			.returning('code')
			.executeTakeFirst();
		throwIfBackupCodeLockLost(signal);

		if (backupRecord === undefined) {
			return { status: 'not-found' as const };
		}

		let fileContent: string;
		try {
			if ((await getFileSize(code)) > MAX_DATA_SIZE) {
				throw new Error('invalid-backup-file');
			}
			throwIfBackupCodeLockLost(signal);

			fileContent = await getFile(code);
			throwIfBackupCodeLockLost(signal);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === 'invalid-backup-file'
			) {
				throw error;
			}
			if (
				error instanceof Error &&
				error.message === 'backup-code-lock-lost'
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
		const importNamespaceData = namespaceData.filter(
			(item): item is IImportNamespaceData => item !== null
		);

		const results = [];
		for (const item of importNamespaceData) {
			throwIfBackupCodeLockLost(signal);

			const current = await trx
				.selectFrom(TABLE_NAME_MAP.userState)
				.selectAll()
				.where('user_id', '=', userId)
				.where('namespace', '=', item.namespace)
				.executeTakeFirst();
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

		return { results, status: 'ok' as const };
	});
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

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'import-backup-code'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const body = await readJsonBody<IImportBackupCodeBody>(request);
	const code = typeof body?.code === 'string' ? body.code.trim() : '';
	if (code === '' || !validate(code)) {
		return createNoStoreErrorResponse('invalid-backup-code', 400);
	}

	const [authModule, dbModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/db'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const database = await dbModule.getAccountDatabase();
			let importResult;
			try {
				importResult = await importBackupData(
					database,
					auth.data.user.id,
					code,
					auth.data.user.state_epoch,
					signal
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
				return createNoStoreErrorResponse('backup-code-not-found', 404);
			}
			if (importResult.status === 'state-epoch-mismatch') {
				return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
					state_epoch: importResult.state_epoch,
				});
			}

			markBackupCodeLockCommitted(signal);
			try {
				throwIfBackupCodeLockLost(signal);
				await deleteFile(code);
			} catch (error) {
				console.warn('Failed to delete imported backup file', {
					codeHash: maskBackupCode(code),
					error,
				});
			}

			return createNoStoreJsonResponse({ results: importResult.results });
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		}

		throw error;
	}
}
