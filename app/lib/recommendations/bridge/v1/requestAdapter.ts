import {
	type TBeverageName,
	type TIngredientName,
	type TRecipeName,
} from '@/data';
import { Beverage, Ingredient, Recipe } from '@/utils';
import { type ISuggestParams } from '@/utils/customer/customer_rare/suggestMeals';

import {
	type IV1RecommendationAvailabilityCategory,
	type IV1RecommendationRequestMessage,
} from './protocol';

const beverageNames = Beverage.getInstance().getValuesByProp('name');
const ingredientNames = Ingredient.getInstance().getValuesByProp('name');
const recipeNames = Recipe.getInstance().getValuesByProp('name');

function createHiddenNames<TName extends string>(
	allNames: ReadonlyArray<TName>,
	availability?: IV1RecommendationAvailabilityCategory<TName>
) {
	const hiddenNames = new Set(availability?.exclude);
	if (availability?.include !== undefined) {
		const includedNames = new Set(availability.include);
		for (const name of allNames) {
			if (!includedNames.has(name)) {
				hiddenNames.add(name);
			}
		}
	}
	return hiddenNames;
}

export function adaptV1RecommendationRequest({
	payload,
}: IV1RecommendationRequestMessage): ISuggestParams {
	const { customer, options = {}, order, selection = {} } = payload;
	const availability = options.availability ?? {};
	return {
		cooker: options.cooker ?? null,
		currentBeverage: selection.beverage ?? null,
		currentRecipe:
			selection.recipe === undefined
				? null
				: {
						extraIngredients: [
							...(selection.recipe.extra_ingredients ?? []),
						],
						name: selection.recipe.name,
					},
		customerName: customer,
		customerOrder: {
			beverageTag: order?.beverage_tag ?? null,
			recipeTag: order?.recipe_tag ?? null,
		},
		hasMystiaCooker: options.mystia_cooker ?? false,
		hiddenBeverages: createHiddenNames<TBeverageName>(
			beverageNames,
			availability.beverages
		),
		hiddenDlcs: new Set(),
		hiddenIngredients: createHiddenNames<TIngredientName>(
			ingredientNames,
			availability.ingredients
		),
		hiddenRecipes: createHiddenNames<TRecipeName>(
			recipeNames,
			availability.recipes
		),
		isFamousShop: options.famous_shop ?? false,
		maxExtraIngredients: options.max_extra_ingredients ?? null,
		maxRating: options.max_rating ?? 4,
		maxResults: options.max_results ?? 5,
		popularTrend: {
			isNegative: options.popular_trend?.negative ?? false,
			tag: options.popular_trend?.tag ?? null,
		},
	};
}
