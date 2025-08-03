import { type TIngredientName, type TRecipeName } from '@/data';

export interface IMealRecipe {
	name: TRecipeName;
	extraIngredients: TIngredientName[];
}
