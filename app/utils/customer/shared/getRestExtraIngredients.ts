import { type TIngredientName } from '@/data';

export function getRestExtraIngredients(
	extraIngredients: ReadonlyArray<TIngredientName>,
	originalIngredientsLength: number
) {
	return extraIngredients.slice(
		0,
		Math.max(5 - originalIngredientsLength, 0)
	);
}
