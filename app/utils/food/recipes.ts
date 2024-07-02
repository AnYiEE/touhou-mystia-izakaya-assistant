import {cloneDeep} from 'lodash';

import {Food} from './base';
import {type TRecipes} from '@/data';
import {type TRecipeTag} from '@/data/types';

type TRecipe = TRecipes[number];
type TProcessPositiveTags<T extends TRecipe> = Omit<T, 'positiveTags'> & {
	positiveTags: TRecipeTag[];
};

export class Recipe<
	TItem extends TRecipes[number] = TRecipes[number],
	TName extends TItem['name'] = TItem['name'],
> extends Food<TProcessPositiveTags<TRecipes[number]>[]> {
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

	public composeTags<T extends string, U extends string>(
		originalIngredients: T[],
		extraIngredients: T[],
		originalRecipePositiveTags: U[],
		extraIngredientTags: U[]
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add('大份' as U);
		}

		for (const [targetTag, coveredTag] of Object.entries(Recipe.tagCoverMap)) {
			if (resultTags.has(targetTag as U)) {
				resultTags.delete(coveredTag as U);
			}
		}

		return [...resultTags];
	}

	public getCustomerSuitability<T extends TName, U extends string, S extends string>(
		name: T,
		customerPositiveTags: U[],
		costomerNegativeTags: S[]
	): {
		negativeTags: U[];
		positiveTags: U[];
		suitability: number;
	};
	public getCustomerSuitability<T extends string[], U extends string, S extends string>(
		recipeTags: T,
		customerPositiveTags: U[],
		costomerNegativeTags: S[]
	): {
		negativeTags: U[];
		positiveTags: U[];
		suitability: number;
	};
	public getCustomerSuitability<T extends string, U extends string>(
		nameOrtags: string | string[],
		customerPositiveTags: T[],
		costomerNegativeTags: U[]
	) {
		const recipeTags = typeof nameOrtags === 'string' ? this.getPropsByName(nameOrtags).positiveTags : nameOrtags;

		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, costomerNegativeTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	private calculateScore(
		recipePositiveTags: string[],
		customerPositiveTags: string[],
		costomerNegativeTags: string[]
	) {
		let score = 0;

		for (const tag of recipePositiveTags) {
			if (customerPositiveTags.includes(tag)) {
				score += 1;
			}
			if (costomerNegativeTags.includes(tag)) {
				score -= 1;
			}
		}

		return score;
	}

	public getIngredientScoreChange<T extends string, U extends string>(
		oldRecipePositiveTags: T[],
		newRecipePositiveTags: T[],
		customerPositiveTags: U[],
		costomerNegativeTags: U[]
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerPositiveTags, costomerNegativeTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerPositiveTags, costomerNegativeTags);

		return newScore - originalScore;
	}
}
