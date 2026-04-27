import { type TBeverageTag, type TRecipeTag } from '@/data';
import type { TBeverage, TRecipe } from '@/utils/types';

interface IBeverageSuitability {
	matchedTags: TBeverageTag[];
	suitability: number;
}

export type TBeverageWithSuitability = Prettify<
	TBeverage & IBeverageSuitability
>;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

interface IRecipeSuitability {
	matchedNegativeTags: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
}

export type TRecipeWithSuitability = Prettify<TRecipe & IRecipeSuitability>;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type {
	ICustomerTabStyle,
	IIngredientsTabStyle,
	ITableColumn,
	ITableSortDescriptor,
	TCustomerTabStyleMap,
	TIngredientsTabStyleMap,
	TTab,
	TTabVisibilityState,
} from '@/(pages)/customer-shared/types';
