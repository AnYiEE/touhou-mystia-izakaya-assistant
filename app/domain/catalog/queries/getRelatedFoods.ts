import type { TFood } from '@/domain/catalog/food/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';

const relatedFoodsCache = new WeakMap<
	ReadonlyArray<TFood>,
	Map<TIngredientId, TFood[]>
>();

export function getRelatedFoods(
	ingredient: TIngredientId,
	foods: ReadonlyArray<TFood>
) {
	const foodCache = relatedFoodsCache.getOrInsertComputed(
		foods,
		() => new Map()
	);

	return foodCache.getOrInsertComputed(ingredient, () => {
		const relatedFoods: TFood[] = [];

		foods.forEach((food) => {
			if (
				food.recipes.some(({ ingredients }) =>
					ingredients.includes(ingredient)
				)
			) {
				relatedFoods.push(food);
			}
		});

		return relatedFoods;
	});
}
