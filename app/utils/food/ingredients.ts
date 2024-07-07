import {Food} from './base';
import {type TIngredients} from '@/data';
import type {TIngredientTag, TRecipeTag} from '@/data/types';

export class Ingredient extends Food<TIngredients> {
	constructor(data: TIngredients) {
		super(data);

		this._data = data;
	}

	public calculateTagsWithPopular(
		ingredientTags: TIngredientTag[],
		popular: {
			isNegative: boolean;
			tag: TIngredientTag | TRecipeTag | null;
		}
	) {
		const ingredientTagsWithPopular = [...ingredientTags] as (TIngredientTag | '流行厌恶' | '流行喜爱')[];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && ingredientTags.includes(currentPopularTag as TIngredientTag)) {
			ingredientTagsWithPopular.push(isNegativePopularTag ? '流行厌恶' : '流行喜爱');
		}

		return ingredientTagsWithPopular;
	}
}
