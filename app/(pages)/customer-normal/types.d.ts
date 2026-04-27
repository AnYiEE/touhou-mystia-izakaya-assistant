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
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
}

export type TRecipeWithSuitability = Prettify<TRecipe & IRecipeSuitability>;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type {
	ICustomerTabStyle,
	ITableColumn,
	ITableSortDescriptor,
	TTab,
	TTabVisibilityState,
} from '@/(pages)/customer-shared/types';
