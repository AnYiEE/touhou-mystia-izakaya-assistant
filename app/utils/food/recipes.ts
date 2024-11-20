import {cloneDeep, isObjectLike, sortBy} from 'lodash';

import {Food} from './base';
import {Ingredient} from './ingredients';
import {
	DARK_MATTER_NAME,
	RECIPE_LIST,
	type TCustomerRareId,
	type TIngredientId,
	type TIngredientTagId,
	type TRecipeId,
	type TRecipeTagId,
	type TRecipes,
} from '@/data';
import {type IPopularData, type IRecipeData} from '@/stores';
import {intersection} from '@/utils';

type TRecipe = TRecipes[number];
type TProcessPositiveTags<T extends TRecipe> = Omit<T, 'positiveTags'> & {
	positiveTags: TRecipeTagId[];
};

type TBondRecipes = {
	id: TRecipeId;
	level: number;
}[];

export class Recipe extends Food<TRecipes> {
	private static _instance: Recipe | undefined;

	private static _tagCoverMap = {
		[-1]: 28,
		0: 2,
		6: 7,
		9: 8,
		22: 21,
	} as const satisfies Partial<Record<TRecipeTagId, TRecipeTagId>>;

	private static _bondRecipesCache = new Map<TCustomerRareId, TBondRecipes>();

	private constructor(data: TRecipes) {
		const clonedData = cloneDeep(data);

		(clonedData as TProcessPositiveTags<TRecipes[number]>[]).forEach((recipe) => {
			const {name, positiveTags, price} = recipe;
			if (name !== DARK_MATTER_NAME) {
				if (price > 60) {
					positiveTags.push(-3);
				} else if (price < 20) {
					positiveTags.push(-2);
				}
			}
		});

		super(clonedData);
	}

	public static getInstance() {
		if (Recipe._instance !== undefined) {
			return Recipe._instance;
		}

		const instance = new Recipe(RECIPE_LIST);

		Recipe._instance = instance;

		return instance;
	}

	public blockedRecipes: Set<TRecipeId> = new Set([-1]);

	public blockedTags: Set<TRecipeTagId> = new Set([-4]);

	/**
	 * @description Calculate the tags based on the original tags, the popular tag data and the famous shop state.
	 */
	public calculateTagsWithPopular(
		recipeTags: ReadonlyArray<TRecipeTagId>,
		popular: IPopularData,
		isFamousShop: boolean
	) {
		const recipeTagsWithPopular = new Set(recipeTags);
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (isFamousShop && recipeTags.includes(19)) {
			recipeTagsWithPopular.add(-20);
		}

		if (currentPopularTag !== null && recipeTags.includes(currentPopularTag)) {
			recipeTagsWithPopular.add(isNegativePopularTag ? -21 : -20);
		}

		return [...recipeTagsWithPopular];
	}

	/**
	 * @description Check if a recipe contains a dark ingredient.
	 * @returns An object containing tags of all extra ingredients and whether the recipe contains a dark ingredient.
	 */
	public checkDarkMatter(
		recipeData:
			| IRecipeData
			| {
					extraIngredients: ReadonlyArray<TIngredientId>;
					negativeTags: ReadonlyArray<TRecipeTagId>;
			  }
	) {
		let negativeTags: ReadonlyArray<TRecipeTagId>;

		if ('id' in recipeData) {
			negativeTags = this.getPropsById(recipeData.id, 'negativeTags');
		} else {
			negativeTags = recipeData.negativeTags;
		}

		const extraTags = recipeData.extraIngredients.flatMap((extraIngredient) =>
			Ingredient.getInstance().getPropsById(extraIngredient, 'tags')
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
		originalIngredients: ReadonlyArray<TIngredientId>,
		extraIngredients: ReadonlyArray<TIngredientId>,
		originalRecipePositiveTags: ReadonlyArray<TRecipeTagId>,
		extraIngredientTags: ReadonlyArray<TIngredientTagId>,
		popular: IPopularData | null
	) {
		const resultTags = new Set([...originalRecipePositiveTags, ...extraIngredientTags]);
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular ?? {};

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add(-1);
			if (currentPopularTag === -1) {
				resultTags.add(isNegativePopularTag ? -21 : -20);
			}
		}

		Object.entries(Recipe._tagCoverMap).forEach(([targetTag, coveredTag]) => {
			if (resultTags.has(Number(targetTag) as TRecipeTagId)) {
				resultTags.delete(coveredTag);
				if (currentPopularTag === coveredTag) {
					resultTags.delete(isNegativePopularTag ? -21 : -20);
				}
			}
		});

		return [...resultTags] as TRecipeTagId[];
	}

	/**
	 * @description Get the suitability of a recipe for a customer based on their tags.
	 * @returns An object containing the suitability of the recipe and the tags that are common to both the recipe and the customer.
	 */
	public getCustomerSuitability(
		recipeTags: ReadonlyArray<TRecipeTagId>,
		customerNegativeTags: ReadonlyArray<TRecipeTagId>,
		customerPositiveTags: ReadonlyArray<TRecipeTagId>
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
		recipePositiveTags: ReadonlyArray<TRecipeTagId>,
		customerNegativeTags: ReadonlyArray<TRecipeTagId>,
		customerPositiveTags: ReadonlyArray<TRecipeTagId>
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
		oldRecipePositiveTags: ReadonlyArray<TRecipeTagId>,
		newRecipePositiveTags: ReadonlyArray<TRecipeTagId>,
		customerNegativeTags: ReadonlyArray<TRecipeTagId>,
		customerPositiveTags: ReadonlyArray<TRecipeTagId>
	) {
		const originalScore = this.calculateScore(oldRecipePositiveTags, customerNegativeTags, customerPositiveTags);
		const newScore = this.calculateScore(newRecipePositiveTags, customerNegativeTags, customerPositiveTags);

		return newScore - originalScore;
	}

	/**
	 * @description Get the recipes for a customer based on their bond level.
	 */
	public getBondRecipes(customerId: TCustomerRareId) {
		if (Recipe._bondRecipesCache.has(customerId)) {
			return Recipe._bondRecipesCache.get(customerId);
		}

		let bondRecipes: TBondRecipes = [];

		this._data.forEach(({from, id}) => {
			if (isObjectLike(from) && 'bond' in from && from.bond.id === customerId) {
				bondRecipes.push({
					id,
					level: from.bond.level,
				});
			}
		});

		bondRecipes = sortBy(bondRecipes, 'level');

		Recipe._bondRecipesCache.set(customerId, bondRecipes);

		return bondRecipes;
	}
}
