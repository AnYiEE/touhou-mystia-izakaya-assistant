import type { TRecipe } from '@/domain/catalog/food/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';

const relatedRecipesCache = new WeakMap<
	ReadonlyArray<TRecipe>,
	Map<TIngredientName, TRecipe[]>
>();

export function getRelatedRecipes(
	ingredientName: TIngredientName,
	recipes: ReadonlyArray<TRecipe>
) {
	let recipeCache = relatedRecipesCache.get(recipes);
	if (recipeCache === undefined) {
		recipeCache = new Map();
		relatedRecipesCache.set(recipes, recipeCache);
	}

	if (recipeCache.has(ingredientName)) {
		return recipeCache.get(ingredientName);
	}

	const relatedRecipes: TRecipe[] = [];

	recipes.forEach((recipe) => {
		if (
			recipe.recipes.some(({ ingredients }) =>
				ingredients.includes(ingredientName)
			)
		) {
			relatedRecipes.push(recipe);
		}
	});

	recipeCache.set(ingredientName, relatedRecipes);

	return relatedRecipes;
}
