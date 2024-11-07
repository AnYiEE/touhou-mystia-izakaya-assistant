import {cloneDeep, isObjectLike, sortBy} from 'lodash';

import {Food} from './base';
import {Ingredient} from './ingredients';
import {
	DARK_MATTER_NAME,
	DARK_MATTER_TAG,
	RECIPE_LIST,
	TAG_ECONOMICAL,
	TAG_EXPENSIVE,
	TAG_LARGE_PARTITION,
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
	type TCustomerRareNames,
	type TIngredientNames,
	type TRecipeNames,
	type TRecipes,
} from '@/data';
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
		[TAG_LARGE_PARTITION]: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const;

	private static _bondRecipesCache = new Map<TCustomerRareNames, TBondRecipes>();

	private constructor(data: TRecipes) {
		const clonedData = cloneDeep(data);

		(clonedData as TProcessPositiveTags<TRecipes[number]>[]).forEach((recipe) => {
			const {name, positiveTags, price} = recipe;
			if (name !== DARK_MATTER_NAME) {
				if (price > 60) {
					positiveTags.push(TAG_EXPENSIVE);
				} else if (price < 20) {
					positiveTags.push(TAG_ECONOMICAL);
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

	public blockedRecipes: Set<TRecipeNames> = new Set([DARK_MATTER_NAME]);

	public blockedTags: Set<TRecipeTag> = new Set([DARK_MATTER_TAG]);

	/**
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(recipeTags: ReadonlyArray<TRecipeTag>, popular: IPopularData) {
		const recipeTagsWithPopular = [...recipeTags];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag !== null && recipeTags.includes(currentPopularTag as TRecipeTag)) {
			recipeTagsWithPopular.push(isNegativePopularTag ? TAG_POPULAR_NEGATIVE : TAG_POPULAR_POSITIVE);
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
	 * @description Compose recipe tags based on all ingredient count, original recipe tags, the extra ingredient tags and the popular tag data.
	 */
	public composeTagsWithPopular(
		originalIngredients: ReadonlyArray<TIngredientNames>,
		extraIngredients: ReadonlyArray<TIngredientNames>,
		originalRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		extraIngredientTags: ReadonlyArray<TIngredientTag>,
		popular: IPopularData | null
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular ?? {};

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add(TAG_LARGE_PARTITION);
			if (currentPopularTag === TAG_LARGE_PARTITION) {
				resultTags.add(isNegativePopularTag ? TAG_POPULAR_NEGATIVE : TAG_POPULAR_POSITIVE);
			}
		}

		Object.entries(Recipe._tagCoverMap).forEach(([targetTag, coveredTag]) => {
			if (resultTags.has(targetTag as TRecipeTag)) {
				resultTags.delete(coveredTag);
				if (currentPopularTag === coveredTag) {
					resultTags.delete(isNegativePopularTag ? TAG_POPULAR_NEGATIVE : TAG_POPULAR_POSITIVE);
				}
			}
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
	public getBondRecipes(customerName: TCustomerRareNames) {
		if (Recipe._bondRecipesCache.has(customerName)) {
			return Recipe._bondRecipesCache.get(customerName);
		}

		let bondRecipes: TBondRecipes = [];

		this._data.forEach(({from, name}) => {
			if (isObjectLike(from) && 'bond' in from && from.bond.name === customerName) {
				bondRecipes.push({
					level: from.bond.level,
					name,
				});
			}
		});

		bondRecipes = sortBy(bondRecipes, 'level');

		Recipe._bondRecipesCache.set(customerName, bondRecipes);

		return bondRecipes;
	}
}
