import type { TIngredientId } from '@/domain/data/ingredients/types';

export function getRestExtraIngredients(
	extraIngredients: ReadonlyArray<TIngredientId>,
	originalIngredientsLength: number
) {
	return extraIngredients.slice(
		0,
		Math.max(5 - originalIngredientsLength, 0)
	);
}
