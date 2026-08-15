import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { INormalGuestSavedMeal } from '@/domain/meals/types';

import { normalGuestStore } from './store';

export type TNormalGuestMealsPersistenceSnapshot = Partial<
	Record<TNormalGuestId, INormalGuestSavedMeal[]>
>;

export function readNormalGuestMealsPersistenceSnapshot(): TNormalGuestMealsPersistenceSnapshot {
	return normalGuestStore.persistence.meals.get();
}

export function replaceNormalGuestMealsPersistenceSnapshot(
	snapshot: TNormalGuestMealsPersistenceSnapshot
): void {
	normalGuestStore.persistence.meals.set(snapshot);
}
