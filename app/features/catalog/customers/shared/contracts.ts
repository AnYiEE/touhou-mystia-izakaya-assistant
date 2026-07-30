import type {
	IProcessedRecipeVariant,
	TBeverage,
	TRecipe,
} from '@/domain/catalog/food/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';

import { type TTabVisibilityState } from './state/tabVisibility';

export interface ICustomerTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TCustomerTabStyleMap = Record<
	TTabVisibilityState,
	ICustomerTabStyle
>;

export interface IIngredientsTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TIngredientsTabStyleMap = Record<
	TTabVisibilityState,
	IIngredientsTabStyle
>;

export type TTab = 'beverage' | 'customer' | 'ingredient' | 'recipe';

export type TRecipeSuitabilityRow = Prettify<
	Omit<TRecipe, 'recipes'> &
		Omit<IProcessedRecipeVariant, 'id'> & {
			matchedNegativeTags?: TRecipeTag[];
			matchedPositiveTags: TRecipeTag[];
			recipeId: number;
			suitability: number;
		}
>;

export interface IRecipeSuitabilityRowsResult {
	filteredRows: TRecipeSuitabilityRow[];
	pagedRows: TRecipeSuitabilityRow[];
	sortedRows: TRecipeSuitabilityRow[];
	totalPages: number;
}

export type TBeverageSuitabilityRow = Prettify<
	TBeverage & { matchedTags: TBeverageTag[]; suitability: number }
>;

export interface IBeverageSuitabilityRowsResult {
	filteredRows: TBeverageSuitabilityRow[];
	pagedRows: TBeverageSuitabilityRow[];
	sortedRows: TBeverageSuitabilityRow[];
	totalPages: number;
}
