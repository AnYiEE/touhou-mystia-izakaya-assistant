import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TFoodTagId } from '@/domain/data/tags/types';

type TIngredientTypeId =
	keyof typeof import('./ingredientFacts').INGREDIENT_TYPE_MAP;

export interface IIngredient extends IFoodBase {
	tags: TFoodTagId[];
	type: TIngredientTypeId;
}
