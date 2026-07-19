import { isNil } from 'lodash';

import {
	type TBeverageName,
	type TDlc,
	type TIngredientName,
	type TRecipeName,
} from '@/data';
import { checkArrayContainsOf, checkLengthEmpty } from '@/utilities';
import { isAvailableWithHiddenDlcs } from '@/utils/availability';
import type { IAvailabilityPath } from '@/utils/availability/types';

export interface IVisibleSavedMealEntry<TMeal> {
	dataIndex: number;
	meal: TMeal;
	visibleIndex: number;
}

export function getVisibleSavedMeals<TMeal>({
	hiddenBeverages = new Set<TBeverageName>(),
	hiddenDlcs,
	hiddenIngredients = new Set<TIngredientName>(),
	hiddenRecipes = new Set<TRecipeName>(),
	meals,
	resolveAvailabilityRefs,
	resolveItemRefs,
}: {
	hiddenBeverages?: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients?: ReadonlySet<TIngredientName>;
	hiddenRecipes?: ReadonlySet<TRecipeName>;
	meals: ReadonlyArray<TMeal> | null | undefined;
	resolveAvailabilityRefs: (
		meal: TMeal
	) => {
		beveragePaths: ReadonlyArray<IAvailabilityPath> | null;
		ingredientPaths: ReadonlyArray<ReadonlyArray<IAvailabilityPath>>;
		recipePaths: ReadonlyArray<IAvailabilityPath>;
	} | null;
	resolveItemRefs?: (
		meal: TMeal
	) => {
		beverageName: TBeverageName | null;
		ingredientNames: ReadonlyArray<TIngredientName>;
		recipeName: TRecipeName;
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
			availabilityRefs.recipePaths,
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
			((itemRefs.beverageName !== null &&
				hiddenBeverages.has(itemRefs.beverageName)) ||
				hiddenRecipes.has(itemRefs.recipeName) ||
				checkArrayContainsOf(
					itemRefs.ingredientNames,
					hiddenIngredients
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
