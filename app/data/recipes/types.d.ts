import {type TCookerId, type TCurrencyId, type TCustomerRareId, type TIngredientId, type TPlaceId} from '@/data';
import {type FOOD_TAG_MAP} from '@/data/constant';
import type {IFoodBase, TMerchant} from '@/data/types';

export interface IRecipe extends IFoodBase {
	/** @description If the value is `-1`, it means there is no corresponding recipe. */
	recipeId: number;
	ingredients: TIngredientId[];
	positiveTags: (keyof typeof FOOD_TAG_MAP)[];
	negativeTags: (keyof typeof FOOD_TAG_MAP)[];
	cooker: TCookerId;
	max: number;
	min: number;
	from:
		| string
		| Partial<{
				bond: {
					id: TCustomerRareId;
					level: number;
				};
				buy: {
					name: TMerchant;
					price: {
						currency: TCurrencyId;
						amount: number;
					};
				};
				/** @description Recipes by levelup. */
				levelup: [number, TPlaceId | null];
				/** @description Initial recipes. */
				self: true;
		  }>;
}

export type TRecipes = typeof import('./data').RECIPE_LIST;

export type TRecipeId = TRecipes[number]['id'];
export type TRecipeName = TRecipes[number]['name'];
