import type { TAvailabilityItemWithPinyin } from '@/domain/catalog/shared/types';
import type { TBeverages } from '@/domain/data/beverages/types';
import type { TIngredients } from '@/domain/data/ingredients/types';
import type { TPlace } from '@/domain/data/places/types';
import type { TRecipes } from '@/domain/data/recipes/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TRecipeTag } from '@/domain/data/tags/types';
import type { TFoodName } from '@/domain/data/types';
import { type TSourcePlace } from '@/domain/places/sourceText';

export interface IFood<T extends TFoodName = TFoodName> extends Omit<
	IFoodBase,
	'from'
> {
	name: T;
}

export type TProcessedBeverage = Prettify<
	TBeverages[number] & { places: TPlace[] }
>;

export type TProcessedIngredient = Prettify<
	TIngredients[number] & { places: TPlace[] }
>;

export type TProcessedRecipe = Prettify<
	Omit<TRecipes[number], 'baseCookTime' | 'positiveTags'> & {
		cookTime: { max: number; min: number };
		places: TSourcePlace[];
		positiveTags: TRecipeTag[];
	}
>;

export type TBeverage = TAvailabilityItemWithPinyin<TProcessedBeverage>;
export type TIngredient = TAvailabilityItemWithPinyin<TProcessedIngredient>;
export type TRecipe = TAvailabilityItemWithPinyin<TProcessedRecipe>;
