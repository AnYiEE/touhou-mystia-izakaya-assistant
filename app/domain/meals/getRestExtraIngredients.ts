import type { TIngredientName } from '@/domain/data/ingredients/types';

export function getRestExtraIngredients(
	extraIngredients: ReadonlyArray<TIngredientName>,
	originalIngredientsLength: number
) {
	return extraIngredients.slice(
		0,
		Math.max(5 - originalIngredientsLength, 0)
	);
}
