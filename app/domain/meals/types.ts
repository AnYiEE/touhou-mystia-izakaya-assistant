import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { IGuestOrder } from '@/domain/orders/types';

export interface IMealFood {
	extraIngredients: TIngredientId[];
	recipeId: TRecipeId;
}

export interface IResolvedMealFood {
	baseIngredients: ReadonlyArray<TIngredientId>;
	cookerType: TCookerTypeId;
	cookTime: { max: number; min: number };
	extraIngredients: ReadonlyArray<TIngredientId>;
	food: TFoodId;
	recipeId: TRecipeId;
}

export interface INormalGuestSavedMeal {
	beverage: TBeverageId | null;
	food: IMealFood;
}

export interface ISpecialGuestSavedMeal {
	beverage: TBeverageId;
	food: IMealFood;
	hasMystiaCooker: boolean;
	order: IGuestOrder;
}
