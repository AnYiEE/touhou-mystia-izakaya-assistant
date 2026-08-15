import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TNormalGuestMealsPersistenceSnapshot,
	readNormalGuestMealsPersistenceSnapshot,
	replaceNormalGuestMealsPersistenceSnapshot,
} from '@/features/catalog/guests/normal/client/state/accountSync';

import { mergeMealSnapshot } from './meals';
import {
	migrateNormalGuestMealsSnapshot,
	normalizeNormalGuestMealsSnapshot,
	validateNormalGuestMealsSnapshot,
} from './savedMealsMigration';

function getLocalNormalGuestMealsSnapshot() {
	const data = structuredClone(readNormalGuestMealsPersistenceSnapshot());
	return migrateNormalGuestMealsSnapshot(data, 3);
}

export const normalGuestMealsSerializer = {
	deserialize(data) {
		return this.migrate(
			data,
			SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.normalGuestMeals]
		);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return getLocalNormalGuestMealsSnapshot();
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.normalGuestMeals,
		});
	},
	migrate(data, version) {
		return migrateNormalGuestMealsSnapshot(data, version);
	},
	serialize(data) {
		return normalizeNormalGuestMealsSnapshot(data);
	},
	setLocalSnapshot(data) {
		replaceNormalGuestMealsPersistenceSnapshot(
			normalizeNormalGuestMealsSnapshot(data)
		);
	},
	validate(data): data is TNormalGuestMealsPersistenceSnapshot {
		return validateNormalGuestMealsSnapshot(data);
	},
} satisfies ISyncNamespaceSerializer<TNormalGuestMealsPersistenceSnapshot>;
