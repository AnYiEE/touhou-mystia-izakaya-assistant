import {type TRecipeTag} from '@/data';
import type {TRecipe} from '@/utils/types';

type TRecipeSuitability = {
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
};

export type TRecipeWithSuitability = TRecipe & TRecipeSuitability;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type {
	ICustomerTabStyle,
	TBeverageWithSuitability,
	TBeveragesWithSuitability,
	TTab,
} from '@/(pages)/customer-rare/types';
