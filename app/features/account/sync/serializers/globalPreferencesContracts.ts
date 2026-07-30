import { type IGlobalPreferencesPersistenceSnapshot } from '@/features/preferences/client/state/accountSync';

export type TGlobalPreferencesSnapshot = IGlobalPreferencesPersistenceSnapshot;

export interface IGlobalPreferencesSetValueOrders {
	beverageColumns: ReadonlyArray<string>;
	hiddenBeverages: ReadonlyArray<string>;
	hiddenDlcs: ReadonlyArray<string>;
	hiddenIngredients: ReadonlyArray<string>;
	hiddenRecipes: ReadonlyArray<string>;
	recipeColumns: ReadonlyArray<string>;
}
