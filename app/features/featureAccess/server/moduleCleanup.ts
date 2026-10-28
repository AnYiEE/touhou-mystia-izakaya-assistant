import { type Transaction } from 'kysely';

import { type TFeatureModuleKey } from '@/domain/featureAccess/contracts';

import type { TDatabase } from '@/infrastructure/database/schema';

import { deleteFeatureAccessGroupsModulesByKeysInTransaction } from './groupRepository';
import { deleteFeatureModulePoliciesByKeysInTransaction } from './modulePolicyRepository';
import { deleteUserFeatureAccessOverridesByModuleKeysInTransaction } from './userAccessOverrideRepository';

export async function deleteFeatureAccessModuleReferencesInTransaction(
	trx: Transaction<TDatabase>,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	const uniqueModuleKeys = [...new Set(moduleKeys)];
	if (uniqueModuleKeys.length === 0) {
		return;
	}

	await deleteFeatureModulePoliciesByKeysInTransaction(trx, uniqueModuleKeys);
	await deleteFeatureAccessGroupsModulesByKeysInTransaction(
		trx,
		uniqueModuleKeys
	);
	await deleteUserFeatureAccessOverridesByModuleKeysInTransaction(
		trx,
		uniqueModuleKeys
	);
}
