import {cloneDeep, intersection, isObjectLike, sortBy} from 'lodash';

import {Food} from './base';
import {Ingredient} from './ingredients';
import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';
import {RECIPE_LIST, type TIngredientNames, type TRecipeNames, type TRecipes} from '@/data';
import type {TIngredientTag, TRecipeTag} from '@/data/types';
import {type IPopularData, type IRecipeData} from '@/stores';

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
			if (name === '黑暗物质') {
				/* empty */
			} else if (price > 60) {
				positiveTags.push('昂贵');
			} else if (price < 20) {
				positiveTags.push('实惠');
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

	/**
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(recipeTags: TRecipeTag[], popular: IPopularData) {
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
					extraIngredients: TIngredientNames[];
					negativeTags: TRecipeTag[];
			  }
	) {
		let negativeTags: TRecipeTag[];

		if ('name' in recipeData) {
			negativeTags = this.getPropsByName(recipeData.name).negativeTags;
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
		originalIngredients: TIngredientNames[],
		extraIngredients: TIngredientNames[],
		originalRecipePositiveTags: TRecipeTag[],
		extraIngredientTags: (TIngredientTag | '流行厌恶' | '流行喜爱')[]
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

		return [...resultTags];
	}

	/**
	 * @description Get the suitability of a recipe for a customer based on their tags.
	 * @returns An object containing the suitability of the recipe and the tags that are common to both the recipe and the customer.
	 */
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

	/**
	 * @description Calculate the suitability score change when adding or removing an extra ingredient from a recipe.
	 */
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

	/**
	 * @description Get the recipes for a customer based on their bond level.
	 */
	public getBondRecipes(customerData: ICurrentCustomer) {
		if (Recipe._bondRecipesCache.has(customerData.name)) {
			return Recipe._bondRecipesCache.get(customerData.name);
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

		Recipe._bondRecipesCache.set(customerData.name, bondRecipes);

		return bondRecipes;
	}
}
