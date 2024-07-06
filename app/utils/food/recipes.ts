import {cloneDeep} from 'lodash';

import {Food} from './base';
import {type TIngredientNames, type TRecipes} from '@/data';
import {type TIngredientTag, type TRecipeTag} from '@/data/types';

type TRecipe = TRecipes[number];
type TProcessPositiveTags<T extends TRecipe> = Omit<T, 'positiveTags'> & {
	positiveTags: TRecipeTag[];
};

export class Recipe extends Food<TProcessPositiveTags<TRecipes[number]>[]> {
	private static tagCoverMap = {
		大份: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const;

	constructor(data: TProcessPositiveTags<TRecipes[number]>[]) {
		const clonedData = cloneDeep(data);

		for (const recipe of clonedData) {
			const {positiveTags, price} = recipe;
			if (price > 60) {
				positiveTags.push('昂贵');
			} else if (price < 20) {
				positiveTags.push('实惠');
			}
		}

		super(clonedData);

		this._data = clonedData;
	}

	public calcTagsWithPopular(
		recipeTags: TRecipeTag[],
		popular: {
			isNegative: boolean;
			tag: TIngredientTag | TRecipeTag | null;
		}
	) {
		const recipeTagsWithPopular = [...recipeTags];
		const {isNegative: currentPopularTagIsNegative, tag: currentPopularTag} = popular;

		if (currentPopularTag && recipeTags.includes(currentPopularTag as TRecipeTag)) {
			recipeTagsWithPopular.push(currentPopularTagIsNegative ? '流行厌恶' : '流行喜爱');
		}

		return recipeTagsWithPopular;
	}

	public composeTags(
		originalIngredients: TIngredientNames[],
		extraIngredients: TIngredientNames[],
		originalRecipePositiveTags: TRecipeTag[],
		extraIngredientTags: (TIngredientTag | '流行厌恶' | '流行喜爱')[]
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add('大份');
		}

		for (const [targetTag, coveredTag] of Object.entries(Recipe.tagCoverMap)) {
			if (resultTags.has(targetTag as TRecipeTag)) {
				resultTags.delete(coveredTag);
			}
		}

		return [...resultTags];
	}

	public getCustomerSuitability(
		recipeTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[]
	) {
		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, customerNegativeTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	private calculateScore(
		recipePositiveTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[]
	) {
		let score = 0;

		for (const tag of recipePositiveTags) {
			if (customerPositiveTags.includes(tag)) {
				score += 1;
			}
			if (customerNegativeTags.includes(tag)) {
				score -= 1;
			}
		}

		return score;
	}

	public getIngredientScoreChange(
		oldRecipePositiveTags: TRecipeTag[],
		newRecipePositiveTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[]
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerPositiveTags, customerNegativeTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerPositiveTags, customerNegativeTags);

		return newScore - originalScore;
	}
}
