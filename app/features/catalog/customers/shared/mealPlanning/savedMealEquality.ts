import type { IMealRecipe } from '@/domain/meals/types';

export function isMealRecipeEqual(
	mealRecipe: IMealRecipe,
	targetRecipe: IMealRecipe
) {
	return (
		mealRecipe.name === targetRecipe.name &&
		mealRecipe.recipeId === targetRecipe.recipeId &&
		mealRecipe.extraIngredients.length ===
			targetRecipe.extraIngredients.length &&
		mealRecipe.extraIngredients.every(
			(ingredientName, index) =>
				ingredientName === targetRecipe.extraIngredients[index]
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

	return meals.filter((_, index) => index !== targetIndex);
}
