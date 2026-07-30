import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { IMealRecipe } from '@/domain/meals/types';

import { customerNormalStore } from './store';

export interface ICustomerNormalSavedMealSnapshot {
	beverage: TBeverageName | null;
	recipe: IMealRecipe;
}

export type TCustomerNormalMealsPersistenceSnapshot = Partial<
	Record<TCustomerNormalName, ICustomerNormalSavedMealSnapshot[]>
>;

export function readCustomerNormalMealsPersistenceSnapshot(): TCustomerNormalMealsPersistenceSnapshot {
	return customerNormalStore.persistence.meals.get();
}

export function replaceCustomerNormalMealsPersistenceSnapshot(
	snapshot: TCustomerNormalMealsPersistenceSnapshot
): void {
	customerNormalStore.persistence.meals.set(snapshot);
}
