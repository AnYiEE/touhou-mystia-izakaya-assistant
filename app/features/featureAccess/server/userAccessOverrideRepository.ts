import { type Transaction } from 'kysely';

import {
	type TFeatureAccessOverrideEffect,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import type { TDatabase } from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

export interface IReplaceUserFeatureAccessOverrideInput {
	createdByAdmin: string | null;
	effect: TFeatureAccessOverrideEffect;
	moduleKey: TFeatureModuleKey;
	now?: number;
	updatedByAdmin: string | null;
}

export async function listUserFeatureAccessOverridesInTransaction(
	trx: Transaction<TDatabase>,
	userId: string
): Promise<Partial<Record<TFeatureModuleKey, TFeatureAccessOverrideEffect>>> {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.userFeatureAccessOverride)
		.select(['module_key', 'effect'])
		.where('user_id', '=', userId)
		.orderBy('module_key')
		.execute();
	const result: Partial<
		Record<TFeatureModuleKey, TFeatureAccessOverrideEffect>
	> = {};
	for (const record of records) {
		result[record.module_key as TFeatureModuleKey] = record.effect;
	}
	return result;
}

export async function replaceUserFeatureAccessOverridesInTransaction(
	trx: Transaction<TDatabase>,
	userId: string,
	overrides: ReadonlyArray<IReplaceUserFeatureAccessOverrideInput>
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.userFeatureAccessOverride)
		.where('user_id', '=', userId)
		.execute();
	const uniqueOverrides = [
		...new Map(
			overrides.map((override) => [override.moduleKey, override])
		).values(),
	];
	if (uniqueOverrides.length === 0) {
		return;
	}
	await trx
		.insertInto(TABLE_NAME_MAP.userFeatureAccessOverride)
		.values(
			uniqueOverrides.map((override) => {
				const now = override.now ?? Date.now();
				return {
					created_at: now,
					created_by_admin: override.createdByAdmin,
					effect: override.effect,
					module_key: override.moduleKey,
					updated_at: now,
					updated_by_admin: override.updatedByAdmin,
					user_id: userId,
				};
			})
		)
		.execute();
}

export async function deleteUserFeatureAccessOverridesByUserIdInTransaction(
	trx: Transaction<TDatabase>,
	userId: string
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.userFeatureAccessOverride)
		.where('user_id', '=', userId)
		.execute();
}

export async function deleteUserFeatureAccessOverridesByModuleKeysInTransaction(
	trx: Transaction<TDatabase>,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	if (moduleKeys.length === 0) {
		return;
	}
	await trx
		.deleteFrom(TABLE_NAME_MAP.userFeatureAccessOverride)
		.where('module_key', 'in', [...moduleKeys])
		.execute();
}
