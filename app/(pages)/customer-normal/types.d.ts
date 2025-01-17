import type {TRecipe} from '@/(pages)/customer-rare/types';
import {type TRecipeTag} from '@/data';

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
	TRecipe,
	TTab,
} from '@/(pages)/customer-rare/types';
