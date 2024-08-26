import {Food} from './base';
import {INGREDIENT_LIST, type TIngredients} from '@/data';
import type {TIngredientTag} from '@/data/types';
import {type IPopularData} from '@/stores';

export class Ingredient extends Food<TIngredients> {
	private static _instance: Ingredient | undefined;

	private constructor(data: TIngredients) {
		super(data);

		this._data = data;
	}

	public static getInstance() {
		if (Ingredient._instance) {
			return Ingredient._instance;
		}

		const instance = new Ingredient(INGREDIENT_LIST);

		Ingredient._instance = instance;

		return instance;
	}

	/**
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(ingredientTags: TIngredientTag[], popular: IPopularData) {
		const ingredientTagsWithPopular = [...ingredientTags] as (TIngredientTag | '流行厌恶' | '流行喜爱')[];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && ingredientTags.includes(currentPopularTag as TIngredientTag)) {
			ingredientTagsWithPopular.push(isNegativePopularTag ? '流行厌恶' : '流行喜爱');
		}

		return ingredientTagsWithPopular;
	}
}
