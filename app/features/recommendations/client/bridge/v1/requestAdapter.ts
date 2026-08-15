import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { ISuggestParams } from '@/domain/recommendations/types';

import {
	type IV1RecommendationAvailabilityCategory,
	type IV1RecommendationRequestMessage,
} from './protocol';

const beverages = BeverageCatalog.getInstance().getValuesByProp('id');
const foods = FoodCatalog.getInstance().getValuesByProp('id');
const ingredients = IngredientCatalog.getInstance().getValuesByProp('id');

function createHiddenItems<TId extends number>(
	allItems: ReadonlyArray<TId>,
	availability?: IV1RecommendationAvailabilityCategory<TId>
) {
	const hiddenItems = new Set(availability?.exclude);
	if (availability?.include !== undefined) {
		const includedItems = new Set(availability.include);
		for (const item of allItems) {
			if (!includedItems.has(item)) {
				hiddenItems.add(item);
			}
		}
	}
	return hiddenItems;
}

export function adaptV1RecommendationRequest({
	payload,
}: IV1RecommendationRequestMessage): ISuggestParams {
	const {
		options = {},
		order,
		selection = {},
		special_guest_id: specialGuest,
	} = payload;
	const availability = options.availability ?? {};
	return {
		cooker: options.cooker_id ?? null,
		currentBeverage: selection.beverage_id ?? null,
		currentFood:
			selection.food === undefined
				? null
				: {
						extraIngredients: [
							...(selection.food.extra_ingredient_ids ?? []),
						],
						recipeId: selection.food.recipe_id,
					},
		guestOrder: {
			beverageTag: order?.beverage_tag_id ?? null,
			foodTag: order?.food_tag_id ?? null,
		},
		hasMystiaCooker: options.mystia_cooker ?? false,
		hiddenBeverages: createHiddenItems<TBeverageId>(
			beverages,
			availability.beverages
		),
		hiddenDlcs: new Set(),
		hiddenFoods: createHiddenItems<TFoodId>(foods, availability.foods),
		hiddenIngredients: createHiddenItems<TIngredientId>(
			ingredients,
			availability.ingredients
		),
		isFamousShop: options.famous_shop ?? false,
		maxExtraIngredients: options.max_extra_ingredients ?? null,
		maxRating: options.max_rating ?? 4,
		maxResults: options.max_results ?? 5,
		popularTrend: {
			isNegative: options.popular_trend?.negative ?? false,
			tag: options.popular_trend?.food_tag_id ?? null,
		},
		specialGuest,
	};
}
