import type { IMealFood } from '@/domain/meals/types';

export function isMealFoodEqual(mealFood: IMealFood, targetFood: IMealFood) {
	return (
		mealFood.recipeId === targetFood.recipeId &&
		mealFood.extraIngredients.length ===
			targetFood.extraIngredients.length &&
		mealFood.extraIngredients.every(
			(ingredient, index) =>
				ingredient === targetFood.extraIngredients[index]
		)
	);
}

export function removeFirstMatchingMeal<TMeal>(
	meals: ReadonlyArray<TMeal>,
	targetMeal: TMeal,
	isEqual: (meal: TMeal, targetMeal: TMeal) => boolean
) {
	const targetIndex = meals.findIndex(
		(meal) => meal === targetMeal || isEqual(meal, targetMeal)
	);

	if (targetIndex === -1) {
		return [...meals];
	}

	return meals.toSpliced(targetIndex, 1);
}
