import {
	type TCustomerNormalName,
	type TCustomerRareName,
	type TIngredientName,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { IPopularTrend } from '@/types';
import { CustomerNormal, CustomerRare, Recipe } from '@/utils';

interface IFullRecipeSuitabilityBaseParams {
	recipeName: TRecipeName;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	recipePositiveTags: ReadonlyArray<TRecipeTag>;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}

interface IFullRecipeSuitabilityNormalParams extends IFullRecipeSuitabilityBaseParams {
	customerName: TCustomerNormalName;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	customerType: 'normal';
}

interface IFullRecipeSuitabilityRareParams extends IFullRecipeSuitabilityBaseParams {
	customerName: TCustomerRareName;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	customerType: 'rare';
}

interface IFullRecipeSuitabilityResult {
	matchedNegativeTags: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
	recipeTagsWithTrend: TRecipeTag[];
}

export function getFullRecipeSuitability({
	customerName,
	customerNegativeTags = [],
	customerPositiveTags,
	customerType,
	isFamousShop,
	popularTrend,
	recipeIngredients,
	recipeName,
	recipePositiveTags,
}:
	| IFullRecipeSuitabilityNormalParams
	| IFullRecipeSuitabilityRareParams): IFullRecipeSuitabilityResult {
	const instance_recipe = Recipe.getInstance();

	const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		recipeIngredients,
		[],
		recipePositiveTags,
		[],
		popularTrend
	);
	const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
		composedRecipeTags,
		popularTrend,
		isFamousShop
	);

	if (customerType === 'rare') {
		const instance_customer = CustomerRare.getInstance();
		const { recipe: easterEggRecipe, score: easterEggScore } =
			instance_customer.checkRecipeEasterEgg({
				currentCustomerName: customerName,
				currentRecipeName: recipeName,
			});

		if (recipeName === easterEggRecipe) {
			return {
				matchedNegativeTags: [],
				matchedPositiveTags: [],
				recipeTagsWithTrend,
				suitability: easterEggScore > 0 ? Infinity : -Infinity,
			};
		}
	} else {
		const instance_customer = CustomerNormal.getInstance();
		const recipe = instance_recipe.getPropsByName(recipeName);
		const { recipe: easterEggRecipe, score: easterEggScore } =
			instance_customer.checkEasterEgg({
				currentCustomerName: customerName,
				currentRecipe: recipe,
			});

		if (recipeName === easterEggRecipe) {
			return {
				matchedNegativeTags: [],
				matchedPositiveTags: [],
				recipeTagsWithTrend,
				suitability: easterEggScore > 0 ? Infinity : -Infinity,
			};
		}
	}

	const {
		negativeTags: matchedNegativeTags,
		positiveTags: matchedPositiveTags,
		suitability,
	} = instance_recipe.getCustomerSuitability(
		recipeTagsWithTrend,
		customerPositiveTags,
		customerNegativeTags
	);

	return {
		matchedNegativeTags,
		matchedPositiveTags,
		recipeTagsWithTrend,
		suitability,
	};
}
