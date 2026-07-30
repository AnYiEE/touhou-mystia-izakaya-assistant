import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';

export interface IMealRecipe {
	name: TRecipeName;
	extraIngredients: TIngredientName[];
}
