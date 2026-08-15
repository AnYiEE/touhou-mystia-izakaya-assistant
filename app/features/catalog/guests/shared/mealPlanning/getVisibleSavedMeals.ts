import isNil from 'lodash/isNil.js';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import type { IAvailabilityPath } from '@/domain/availability/types';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export interface IVisibleSavedMealEntry<TMeal> {
	dataIndex: number;
	meal: TMeal;
	visibleIndex: number;
}

export function getVisibleSavedMeals<TMeal>({
	hiddenBeverages = new Set<TBeverageId>(),
	hiddenDlcs,
	hiddenFoods = new Set<TFoodId>(),
	hiddenIngredients = new Set<TIngredientId>(),
	meals,
	resolveAvailabilityRefs,
	resolveItemRefs,
}: {
	hiddenBeverages?: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenFoods?: ReadonlySet<TFoodId>;
	hiddenIngredients?: ReadonlySet<TIngredientId>;
	meals: ReadonlyArray<TMeal> | null | undefined;
	resolveAvailabilityRefs: (
		meal: TMeal
	) => {
		beveragePaths: ReadonlyArray<IAvailabilityPath> | null;
		foodPaths: ReadonlyArray<IAvailabilityPath>;
		ingredientPaths: ReadonlyArray<ReadonlyArray<IAvailabilityPath>>;
	} | null;
	resolveItemRefs?: (
		meal: TMeal
	) => {
		beverage: TBeverageId | null;
		food: TFoodId;
		ingredients: ReadonlyArray<TIngredientId>;
	} | null;
}): Array<IVisibleSavedMealEntry<TMeal>> {
	if (isNil(meals) || checkLengthEmpty(meals)) {
		return [];
	}

	const visibleMeals: Array<IVisibleSavedMealEntry<TMeal>> = [];

	meals.forEach((meal, dataIndex) => {
		const availabilityRefs = resolveAvailabilityRefs(meal);
		if (availabilityRefs === null) {
			return;
		}

		const requiredItemPaths = [
			...availabilityRefs.ingredientPaths,
			availabilityRefs.foodPaths,
			...(availabilityRefs.beveragePaths === null
				? []
				: [availabilityRefs.beveragePaths]),
		];
		if (
			requiredItemPaths.some(
				(paths) => !isAvailableWithHiddenDlcs(paths, hiddenDlcs)
			)
		) {
			return;
		}

		const itemRefs = resolveItemRefs?.(meal);
		if (itemRefs === null) {
			return;
		}
		if (
			itemRefs !== undefined &&
			((itemRefs.beverage !== null &&
				hiddenBeverages.has(itemRefs.beverage)) ||
				hiddenFoods.has(itemRefs.food) ||
				itemRefs.ingredients.some((ingredient) =>
					hiddenIngredients.has(ingredient)
				))
		) {
			return;
		}

		visibleMeals.push({
			dataIndex,
			meal,
			visibleIndex: visibleMeals.length,
		});
	});

	return visibleMeals;
}
