import { type Transaction } from 'kysely';

import {
	type TFeatureAccessLevel,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import { getAccountDatabase } from '@/features/account/server/persistence/database';

import type {
	TDatabase,
	TFeatureModulePolicy,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

export interface IUpsertFeatureModulePolicyInput {
	accessLevel: TFeatureAccessLevel;
	moduleKey: TFeatureModuleKey;
	now?: number;
	updatedByAdmin: string | null;
}

export function listFeatureModulePoliciesInTransaction(
	trx: Transaction<TDatabase>
) {
	return trx
		.selectFrom(TABLE_NAME_MAP.featureModulePolicy)
		.selectAll()
		.orderBy('module_key')
		.execute();
}

export async function listFeatureModulePolicyOverridesInTransaction(
	trx: Transaction<TDatabase>
): Promise<Partial<Record<TFeatureModuleKey, TFeatureAccessLevel>>> {
	const records = await listFeatureModulePoliciesInTransaction(trx);
	const result: Partial<Record<TFeatureModuleKey, TFeatureAccessLevel>> = {};
	for (const record of records) {
		result[record.module_key as TFeatureModuleKey] = record.access_level;
	}
	return result;
}

export function upsertFeatureModulePolicyInTransaction(
	trx: Transaction<TDatabase>,
	{
		accessLevel,
		moduleKey,
		now = Date.now(),
		updatedByAdmin,
	}: IUpsertFeatureModulePolicyInput
): Promise<TFeatureModulePolicy> {
	return trx
		.insertInto(TABLE_NAME_MAP.featureModulePolicy)
		.values({
			access_level: accessLevel,
			module_key: moduleKey,
			updated_at: now,
			updated_by_admin: updatedByAdmin,
		})
		.onConflict((conflict) =>
			conflict
				.column('module_key')
				.doUpdateSet({
					access_level: accessLevel,
					updated_at: now,
					updated_by_admin: updatedByAdmin,
				})
		)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function deleteFeatureModulePoliciesByKeysInTransaction(
	trx: Transaction<TDatabase>,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	if (moduleKeys.length === 0) {
		return 0;
	}
	const result = await trx
		.deleteFrom(TABLE_NAME_MAP.featureModulePolicy)
		.where('module_key', 'in', [...moduleKeys])
		.executeTakeFirst();
	return Number(result.numDeletedRows);
}

export async function listFeatureModulePolicies() {
	const db = await getAccountDatabase();
	return db
		.selectFrom(TABLE_NAME_MAP.featureModulePolicy)
		.selectAll()
		.orderBy('module_key')
		.execute();
}
