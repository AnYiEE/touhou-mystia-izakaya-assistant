import type {IFoodBase} from '@/data/types';
import type {BeverageNames} from '@/data/beverages';
import type {IngredientNames} from '@/data/ingredients';
import type {RecipeNames} from '@/data/recipes';

type FoodNames = BeverageNames | IngredientNames | RecipeNames;

interface IFood<T extends FoodNames = FoodNames> extends Omit<IFoodBase, 'from'> {
	name: T;
}

export type {IFood};
