import {cloneDeep, isObjectLike, sortBy} from 'lodash';

import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';

import {Food} from './base';
import {Ingredient} from './ingredients';
import {RECIPE_LIST, type TIngredientNames, type TRecipeNames, type TRecipes} from '@/data';
import type {TIngredientTag, TRecipeTag} from '@/data/types';
import {type IPopularData, type IRecipeData} from '@/stores';
import {intersection} from '@/utils';

type TRecipe = TRecipes[number];
type TProcessPositiveTags<T extends TRecipe> = Omit<T, 'positiveTags'> & {
	positiveTags: TRecipeTag[];
};

type TBondRecipes = {
	level: number;
	name: TRecipeNames;
}[];

export class Recipe extends Food<TRecipes> {
	private static _instance: Recipe | undefined;

	private static _tagCoverMap = {
		大份: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const;

	private static _bondRecipesCache = new Map<ICurrentCustomer['name'], TBondRecipes>();

	private constructor(data: TRecipes) {
		const clonedData = cloneDeep(data);

		(clonedData as TProcessPositiveTags<TRecipes[number]>[]).forEach((recipe) => {
			const {name, positiveTags, price} = recipe;
			if (name !== '黑暗物质') {
				if (price > 60) {
					positiveTags.push('昂贵');
				} else if (price < 20) {
					positiveTags.push('实惠');
				}
			}
		});

		super(clonedData);
	}

	public static getInstance() {
		if (Recipe._instance) {
			return Recipe._instance;
		}

		const instance = new Recipe(RECIPE_LIST);

		Recipe._instance = instance;

		return instance;
	}

	public blockedRecipes: Set<TRecipeNames> = new Set(['黑暗物质']);

	public blockedTags: Set<TRecipeTag> = new Set(['黑暗物质']);

	/**
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(recipeTags: ReadonlyArray<TRecipeTag>, popular: IPopularData) {
		const recipeTagsWithPopular = [...recipeTags];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && recipeTags.includes(currentPopularTag as TRecipeTag)) {
			recipeTagsWithPopular.push(isNegativePopularTag ? '流行厌恶' : '流行喜爱');
		}

		return recipeTagsWithPopular;
	}

	/**
	 * @description Check if a recipe contains a dark ingredient.
	 * @returns An object containing tags of all extra ingredients and whether the recipe contains a dark ingredient.
	 */
	public checkDarkMatter(
		recipeData:
			| IRecipeData
			| {
					extraIngredients: ReadonlyArray<TIngredientNames>;
					negativeTags: ReadonlyArray<TRecipeTag>;
			  }
	) {
		let negativeTags: ReadonlyArray<TRecipeTag>;

		if ('name' in recipeData) {
			negativeTags = this.getPropsByName(recipeData.name, 'negativeTags');
		} else {
			negativeTags = recipeData.negativeTags;
		}

		const extraTags = recipeData.extraIngredients.flatMap((extraIngredient) =>
			Ingredient.getInstance().getPropsByName(extraIngredient, 'tags')
		);

		return {
			extraTags,
			isDarkMatter: intersection(extraTags, negativeTags).length > 0,
		};
	}

	/**
	 * @description Compose recipe tags based on all ingredient count, original recipe tags and the extra ingredient tags.
	 */
	public composeTags(
		originalIngredients: ReadonlyArray<TIngredientNames>,
		extraIngredients: ReadonlyArray<TIngredientNames>,
		originalRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		extraIngredientTags: ReadonlyArray<TIngredientTag | '流行厌恶' | '流行喜爱'>
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add('大份');
		}

		Object.entries(Recipe._tagCoverMap)
			.filter(([targetTag]) => resultTags.has(targetTag as TRecipeTag))
			.forEach(([, coveredTag]) => {
				resultTags.delete(coveredTag);
			});

		return [...resultTags] as TRecipeTag[];
	}

	/**
	 * @description Get the suitability of a recipe for a customer based on their tags.
	 * @returns An object containing the suitability of the recipe and the tags that are common to both the recipe and the customer.
	 */
	public getCustomerSuitability(
		recipeTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>
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
		recipePositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>
	) {
		let score = 0;

		recipePositiveTags.forEach((tag) => {
			score -= Number(customerNegativeTags.includes(tag));
			score += Number(customerPositiveTags.includes(tag));
		});

		return score;
	}

	/**
	 * @description Calculate the suitability score change when adding or removing an extra ingredient from a recipe.
	 */
	public getIngredientScoreChange(
		oldRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		newRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerNegativeTags, customerPositiveTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerNegativeTags, customerPositiveTags);

		return newScore - originalScore;
	}

	/**
	 * @description Get the recipes for a customer based on their bond level.
	 */
	public getBondRecipes(customerData: ICurrentCustomer) {
		if (Recipe._bondRecipesCache.has(customerData.name)) {
			return Recipe._bondRecipesCache.get(customerData.name);
		}

		let bondRecipes: TBondRecipes = [];

		this._data.forEach(({from, name}) => {
			if (isObjectLike(from) && 'bond' in from && from.bond.name === customerData.name) {
				bondRecipes.push({
					level: from.bond.level,
					name,
				});
			}
		});

		bondRecipes = sortBy(bondRecipes, 'level');

		Recipe._bondRecipesCache.set(customerData.name, bondRecipes);

		return bondRecipes;
	}
}
