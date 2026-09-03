import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import { normalGuestMealsShape } from '@/features/account/sync/shapes/normalGuestMeals';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TNormalGuestMealsPersistenceSnapshot,
	readNormalGuestMealsPersistenceSnapshot,
	replaceNormalGuestMealsPersistenceSnapshot,
} from '@/features/catalog/guests/normal/client/state/accountSync';

import { mergeMealSnapshot } from './meals';

function getLocalNormalGuestMealsSnapshot() {
	const data = structuredClone(readNormalGuestMealsPersistenceSnapshot());
	try {
		return normalGuestMealsShape.migrate(data, 3);
	} catch {
		return data;
	}
}

export const normalGuestMealsSerializer: ISyncNamespaceSerializer<TNormalGuestMealsPersistenceSnapshot> =
	{
		deserialize(data) {
			return normalGuestMealsSerializer.migrate(
				data,
				SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.normalGuestMeals]
			);
		},
		getDefaultSnapshot() {
			return normalGuestMealsShape.createDefault();
		},
		getLocalSnapshot() {
			const data = getLocalNormalGuestMealsSnapshot();
			return normalGuestMealsShape.normalize(data);
		},
		merge(params) {
			return mergeMealSnapshot({
				...params,
				namespace: SYNC_NAMESPACE_MAP.normalGuestMeals,
			});
		},
		migrate(data, version) {
			return normalGuestMealsShape.migrate(data, version);
		},
		serialize(data) {
			return normalGuestMealsShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceNormalGuestMealsPersistenceSnapshot(
				normalGuestMealsShape.normalize(data)
			);
		},
		validate(data): data is TNormalGuestMealsPersistenceSnapshot {
			return normalGuestMealsShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<TNormalGuestMealsPersistenceSnapshot>;
