import type { TAvailabilityItemWithPinyin } from '@/domain/catalog/shared/types';
import type { TBeverages } from '@/domain/data/beverages/types';
import type { IRecipe } from '@/domain/data/foods/schema';
import type { TFoods } from '@/domain/data/foods/types';
import type { TIngredients } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TFoodTagId } from '@/domain/data/tags/types';

export type TProcessedBeverage = Prettify<
	TBeverages[number] & { maps: TMapLabel[] }
>;

export type TProcessedIngredient = Prettify<
	TIngredients[number] & { maps: TMapLabel[] }
>;

export interface IProcessedRecipe extends Omit<IRecipe, 'baseCookTime'> {
	cookTime: { max: number; min: number };
}

export type TProcessedFood = Prettify<
	Omit<TFoods[number], 'positiveTags' | 'recipes'> & {
		isCollaborationSource: boolean;
		maps: TMapLabel[];
		positiveTags: TFoodTagId[];
		recipes: [IProcessedRecipe, ...IProcessedRecipe[]];
	}
>;

export type TBeverage = TAvailabilityItemWithPinyin<TProcessedBeverage>;
export type TFood = TAvailabilityItemWithPinyin<TProcessedFood>;
export type TIngredient = TAvailabilityItemWithPinyin<TProcessedIngredient>;
export type TRecipe = TFood['recipes'][number];
