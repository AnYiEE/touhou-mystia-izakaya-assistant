import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { IMealFood } from '@/domain/meals/types';

import type { TRatingKey } from './types';

const foodCatalog = FoodCatalog.getInstance();

export interface IEvaluateNormalGuestMealParams {
	currentFoodTagsWithTrend: ReadonlyArray<TFoodTagId>;
	currentMealFood: IMealFood | null;
	currentNormalGuest: TNormalGuestId;
	currentNormalGuestPositiveTags: ReadonlyArray<TFoodTagId>;
}

export function checkNormalGuestFoodEasterEgg({
	currentFood,
	currentNormalGuest,
	mealScore = 0,
}: Pick<IEvaluateNormalGuestMealParams, 'currentNormalGuest'> & {
	currentFood: TFoodId;
	mealScore?: number;
}): { food: TFoodId | null; score: number } {
	switch (currentNormalGuest) {
		case 5003: {
			const food = 4001;
			if (currentFood === food) {
				return { food, score: 0 };
			}
		}
	}

	return { food: null, score: mealScore };
}

function getNormalGuestRatingKey(mealScore: number): TRatingKey {
	if (mealScore <= 0) {
		return 'exbad';
	} else if (mealScore <= 2) {
		return 'norm';
	}

	return 'good';
}

export function evaluateNormalGuestMeal({
	currentFoodTagsWithTrend,
	currentMealFood,
	currentNormalGuest,
	currentNormalGuestPositiveTags,
}: IEvaluateNormalGuestMealParams): TRatingKey | null {
	if (currentMealFood === null) {
		return null;
	}
	const { food: currentFood } = foodCatalog.getRecipeOwnerById(
		currentMealFood.recipeId
	);

	const hasLikedAddedTag = currentFoodTagsWithTrend.some(
		(tag) =>
			!currentFood.positiveTags.includes(tag) &&
			currentNormalGuestPositiveTags.includes(tag)
	);
	let mealScore = 2 + Number(hasLikedAddedTag);

	mealScore = checkNormalGuestFoodEasterEgg({
		currentFood: currentFood.id,
		currentNormalGuest,
		mealScore,
	}).score;

	return getNormalGuestRatingKey(mealScore);
}
