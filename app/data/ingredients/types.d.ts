import {type FOOD_TAG_MAP, type INGREDIENT_TYPE_MAP} from '@/data/constant';
import type {IFoodBase} from '@/data/types';

type TTypeId = keyof typeof INGREDIENT_TYPE_MAP;

export interface IIngredient extends IFoodBase {
	type: TTypeId;
	tags: (keyof typeof FOOD_TAG_MAP)[];
}

export type TIngredients = typeof import('./data').INGREDIENT_LIST;

export type TIngredientId = TIngredients[number]['id'];
export type TIngredientName = TIngredients[number]['name'];
export type TIngredientTypeId = TIngredients[number]['type'];
