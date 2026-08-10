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
	const recipeCache = relatedRecipesCache.getOrInsertComputed(
		recipes,
		() => new Map()
	);

	return recipeCache.getOrInsertComputed(ingredientName, () => {
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

		return relatedRecipes;
	});
}
