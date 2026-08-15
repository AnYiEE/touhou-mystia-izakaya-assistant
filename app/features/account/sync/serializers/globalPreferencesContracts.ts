import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';

import { type IGlobalPreferencesPersistenceSnapshot } from '@/features/preferences/client/state/accountSync';

export type TGlobalPreferencesSnapshot = IGlobalPreferencesPersistenceSnapshot;

export interface IGlobalPreferencesSetValueOrders {
	beverageColumns: ReadonlyArray<string>;
	foodColumns: ReadonlyArray<string>;
	hiddenBeverages: ReadonlyArray<TBeverageId>;
	hiddenDlcs: ReadonlyArray<string>;
	hiddenFoods: ReadonlyArray<TFoodId>;
	hiddenIngredients: ReadonlyArray<TIngredientId>;
}
