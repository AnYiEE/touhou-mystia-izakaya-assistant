import {Food} from './base';
import {INGREDIENT_LIST, type TIngredientTypes, type TIngredients} from '@/data';
import type {TIngredientTag} from '@/data/types';
import {type IPopularData} from '@/stores';
import {isArrayEqual} from '@/utils/isArrayEqual';

export class Ingredient extends Food<TIngredients> {
	private static _instance: Ingredient | undefined;

	/** @description Flag to check if the types are consistent with the original data. */
	private static _isTypesChecked: boolean;

	public static getInstance() {
		if (Ingredient._instance) {
			return Ingredient._instance;
		}

		const instance = new Ingredient(INGREDIENT_LIST);

		Ingredient._instance = instance;

		return instance;
	}

	/**
	 * @description Types sorted in the suggested order. Used for selecting ingredient types.
	 */
	public get sortedTypes() {
		const types = ['海鲜', '肉类', '蔬菜', '其他'] as const satisfies TIngredientTypes[];

		if (Ingredient._isTypesChecked) {
			return types;
		}

		const isTagsEqual = isArrayEqual(types, this.getValuesByProp(this.data, 'type'));
		if (!isTagsEqual) {
			throw new Error(
				'[utils/food/Ingredient]: the given types is inconsistent with the types in the original data'
			);
		}

		Ingredient._isTypesChecked = true;

		return types;
	}

	/**
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(ingredientTags: ReadonlyArray<TIngredientTag>, popular: IPopularData) {
		const ingredientTagsWithPopular = [...ingredientTags] as (TIngredientTag | '流行厌恶' | '流行喜爱')[];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && ingredientTags.includes(currentPopularTag as TIngredientTag)) {
			ingredientTagsWithPopular.push(isNegativePopularTag ? '流行厌恶' : '流行喜爱');
		}

		return ingredientTagsWithPopular;
	}
}
