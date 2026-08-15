import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TSpecialGuestMealsPersistenceSnapshot,
	readSpecialGuestMealsPersistenceSnapshot,
	replaceSpecialGuestMealsPersistenceSnapshot,
} from '@/features/catalog/guests/special/client/state/accountSync';

import { mergeMealSnapshot } from './meals';
import {
	migrateSpecialGuestMealsSnapshot,
	normalizeSpecialGuestMealsSnapshot,
	validateSpecialGuestMealsSnapshot,
} from './savedMealsMigration';

function getLocalSpecialGuestMealsSnapshot() {
	const data = structuredClone(readSpecialGuestMealsPersistenceSnapshot());
	return migrateSpecialGuestMealsSnapshot(data, 3);
}

export const specialGuestMealsSerializer = {
	deserialize(data) {
		return this.migrate(
			data,
			SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.specialGuestMeals]
		);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return getLocalSpecialGuestMealsSnapshot();
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.specialGuestMeals,
		});
	},
	migrate(data, version) {
		return migrateSpecialGuestMealsSnapshot(data, version);
	},
	serialize(data) {
		return normalizeSpecialGuestMealsSnapshot(data);
	},
	setLocalSnapshot(data) {
		replaceSpecialGuestMealsPersistenceSnapshot(
			normalizeSpecialGuestMealsSnapshot(data)
		);
	},
	validate(data): data is TSpecialGuestMealsPersistenceSnapshot {
		return validateSpecialGuestMealsSnapshot(data);
	},
} satisfies ISyncNamespaceSerializer<TSpecialGuestMealsPersistenceSnapshot>;
