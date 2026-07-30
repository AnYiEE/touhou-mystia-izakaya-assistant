import type { TCookerType } from '@/domain/data/cookers/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';

export interface IMealRecipe {
	extraIngredients: TIngredientName[];
	name: TRecipeName;
	recipeId: number;
}

export interface IResolvedMealRecipe {
	baseIngredients: ReadonlyArray<TIngredientName>;
	cooker: TCookerType;
	cookTime: { max: number; min: number };
	extraIngredients: ReadonlyArray<TIngredientName>;
	name: TRecipeName;
	recipeId: number;
}
