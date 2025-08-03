import { type TRecipeTag } from '@/data';
import type { TRecipe } from '@/utils/types';

interface IRecipeSuitability {
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
}

export type TRecipeWithSuitability = Prettify<TRecipe & IRecipeSuitability>;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type {
	ICustomerTabStyle,
	TBeverageWithSuitability,
	TBeveragesWithSuitability,
	TTab,
	TTabVisibilityState,
} from '@/(pages)/customer-rare/types';
