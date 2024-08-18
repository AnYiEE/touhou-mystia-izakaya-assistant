import {cloneDeep, isObjectLike, sortBy} from 'lodash';

import {Food} from './base';
import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';
import {type TIngredientNames, type TRecipeNames, type TRecipes} from '@/data';
import type {TIngredientTag, TRecipeTag} from '@/data/types';
import {type IPopularData} from '@/stores';

type TRecipe = TRecipes[number];
type TProcessPositiveTags<T extends TRecipe> = Omit<T, 'positiveTags'> & {
	positiveTags: TRecipeTag[];
};

type TBondRecipes = {
	level: number;
	name: TRecipeNames;
}[];

export class Recipe extends Food<TProcessPositiveTags<TRecipes[number]>[]> {
	private static tagCoverMap = {
		大份: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const;

	private static bondRecipesCache: Map<ICurrentCustomer['name'], TBondRecipes> = new Map();

	constructor(data: TProcessPositiveTags<TRecipes[number]>[]) {
		const clonedData = cloneDeep(data);

		clonedData.forEach((recipe) => {
			const {positiveTags, price} = recipe;
			if (price > 60) {
				positiveTags.push('昂贵');
			} else if (price < 20) {
				positiveTags.push('实惠');
			}
		});

		super(clonedData);

		this._data = clonedData;
	}

	public calculateTagsWithPopular(recipeTags: TRecipeTag[], popular: IPopularData) {
		const recipeTagsWithPopular = [...recipeTags];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && recipeTags.includes(currentPopularTag as TRecipeTag)) {
			recipeTagsWithPopular.push(isNegativePopularTag ? '流行厌恶' : '流行喜爱');
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

		Object.entries(Recipe.tagCoverMap)
			.filter(([targetTag]) => resultTags.has(targetTag as TRecipeTag))
			.forEach(([, coveredTag]) => {
				resultTags.delete(coveredTag);
			});

		return [...resultTags];
	}

	public getCustomerSuitability(
		recipeTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[]
	) {
		const {commonTags: negativeTags, count: negativeCount} = this.getCommonTags(recipeTags, customerNegativeTags);
		const {commonTags: positiveTags, count: positiveCount} = this.getCommonTags(recipeTags, customerPositiveTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	private calculateScore(
		recipePositiveTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[]
	) {
		let score = 0;

		recipePositiveTags.forEach((tag) => {
			score -= Number(customerNegativeTags.includes(tag));
			score += Number(customerPositiveTags.includes(tag));
		});

		return score;
	}

	public getIngredientScoreChange(
		oldRecipePositiveTags: TRecipeTag[],
		newRecipePositiveTags: TRecipeTag[],
		customerNegativeTags: TRecipeTag[],
		customerPositiveTags: TRecipeTag[]
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerNegativeTags, customerPositiveTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerNegativeTags, customerPositiveTags);

		return newScore - originalScore;
	}

	public getBondRecipes(customerData: ICurrentCustomer) {
		if (Recipe.bondRecipesCache.has(customerData.name)) {
			return Recipe.bondRecipesCache.get(customerData.name);
		}

		let bondRecipes: TBondRecipes = [];

		this._data.forEach((recipe) => {
			const {from} = recipe;
			if (isObjectLike(from) && 'bond' in from && from.bond.name === customerData.name) {
				bondRecipes.push({
					level: from.bond.level,
					name: recipe.name,
				});
			}
		});

		bondRecipes = sortBy(bondRecipes, 'level');

		Recipe.bondRecipesCache.set(customerData.name, bondRecipes);

		return bondRecipes;
	}
}
