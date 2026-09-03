import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import { specialGuestMealsShape } from '@/features/account/sync/shapes/specialGuestMeals';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TSpecialGuestMealsPersistenceSnapshot,
	readSpecialGuestMealsPersistenceSnapshot,
	replaceSpecialGuestMealsPersistenceSnapshot,
} from '@/features/catalog/guests/special/client/state/accountSync';

import { mergeMealSnapshot } from './meals';

function getLocalSpecialGuestMealsSnapshot() {
	const data = structuredClone(readSpecialGuestMealsPersistenceSnapshot());
	try {
		return specialGuestMealsShape.migrate(data, 3);
	} catch {
		return data;
	}
}

export const specialGuestMealsSerializer: ISyncNamespaceSerializer<TSpecialGuestMealsPersistenceSnapshot> =
	{
		deserialize(data) {
			return specialGuestMealsSerializer.migrate(
				data,
				SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.specialGuestMeals]
			);
		},
		getDefaultSnapshot() {
			return specialGuestMealsShape.createDefault();
		},
		getLocalSnapshot() {
			const data = getLocalSpecialGuestMealsSnapshot();
			return specialGuestMealsShape.normalize(data);
		},
		merge(params) {
			return mergeMealSnapshot({
				...params,
				namespace: SYNC_NAMESPACE_MAP.specialGuestMeals,
			});
		},
		migrate(data, version) {
			return specialGuestMealsShape.migrate(data, version);
		},
		serialize(data) {
			return specialGuestMealsShape.normalize(data);
		},
		setLocalSnapshot(data) {
			replaceSpecialGuestMealsPersistenceSnapshot(
				specialGuestMealsShape.normalize(data)
			);
		},
		validate(data): data is TSpecialGuestMealsPersistenceSnapshot {
			return specialGuestMealsShape.validate(data);
		},
	} satisfies ISyncNamespaceSerializer<TSpecialGuestMealsPersistenceSnapshot>;
