import { isObject } from 'lodash';

import { Food } from './base';
import { Ingredient } from './ingredients';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	RECIPE_LIST,
	type TCustomerRareName,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeName,
	type TRecipeTag,
	type TRecipes,
} from '@/data';

import {
	checkLengthEmpty,
	cloneJsonObject,
	intersection,
	numberSort,
	toArray,
	toSet,
} from '@/utilities';
import type { IMealRecipe, IPopularTrend } from '@/types';

type TRecipeProcessedPositiveTags = Prettify<
	Omit<TRecipes[number], 'positiveTags'> & { positiveTags: TRecipeTag[] }
>;

type TBondRecipes = Array<{ level: number; name: TRecipeName }>;

export class Recipe extends Food<TRecipes> {
	private static _instance: Recipe | undefined;

	private static _tagCoverMap = {
		[DYNAMIC_TAG_MAP.expensive]: DYNAMIC_TAG_MAP.economical,
		[DYNAMIC_TAG_MAP.largePartition]: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const satisfies Partial<Record<TRecipeTag, TRecipeTag>>;

	private static _bondRecipesCache = new Map<
		TCustomerRareName,
		TBondRecipes
	>();

	private constructor(data: TRecipes) {
		const clonedData = cloneJsonObject(data);

		(clonedData as TRecipeProcessedPositiveTags[]).forEach((recipe) => {
			const { name, positiveTags, price } = recipe;
			if (name !== DARK_MATTER_META_MAP.name) {
				if (price > 60) {
					positiveTags.push(DYNAMIC_TAG_MAP.expensive);
				} else if (price < 20) {
					positiveTags.push(DYNAMIC_TAG_MAP.economical);
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

	public blockedRecipes: Set<TRecipeName> = toSet(DARK_MATTER_META_MAP.name);
	public blockedTags: Set<TRecipeTag> = toSet(
		DARK_MATTER_META_MAP.positiveTag
	);

	/**
	 * @description Get the recipes for a customer based on their bond level.
	 */
	public getBondRecipes(customerName: TCustomerRareName) {
		if (Recipe._bondRecipesCache.has(customerName)) {
			return Recipe._bondRecipesCache.get(customerName);
		}

		const bondRecipes: TBondRecipes = [];

		this._data.forEach(({ from, name }) => {
			if (
				isObject(from) &&
				'bond' in from &&
				from.bond.name === customerName
			) {
				bondRecipes.push({ level: from.bond.level, name });
			}
		});

		bondRecipes.sort(({ level: a }, { level: b }) => numberSort(a, b));

		Recipe._bondRecipesCache.set(customerName, bondRecipes);

		return bondRecipes;
	}

	/**
	 * @description Calculate the tags based on the original tags, the popular trend data and the famous shop state.
	 */
	public override calculateTagsWithTrend(
		recipeTags: ReadonlyArray<TRecipeTag>,
		popularTrend: IPopularTrend,
		isFamousShop: boolean
	) {
		return super.calculateTagsWithTrend(
			recipeTags,
			popularTrend,
			isFamousShop
		) as TRecipeTag[];
	}

	/**
	 * @description Check if a recipe contains a dark ingredient.
	 * @returns An object containing tags of all extra ingredients and whether the recipe contains a dark ingredient.
	 */
	public checkDarkMatter(
		recipeData:
			| IMealRecipe
			| {
					extraIngredients: ReadonlyArray<TIngredientName>;
					negativeTags: ReadonlyArray<TRecipeTag>;
			  }
	) {
		const negativeTags =
			'name' in recipeData
				? this.getPropsByName(recipeData.name, 'negativeTags')
				: recipeData.negativeTags;

		const instance_ingredient = Ingredient.getInstance();
		const extraTags = recipeData.extraIngredients.flatMap(
			(extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
		);

		return {
			extraTags,
			isDarkMatter: !checkLengthEmpty(
				intersection(extraTags, negativeTags)
			),
		};
	}

	/**
	 * @description Compose recipe tags based on all ingredient count, original recipe tags, the extra ingredient tags and the popular trend data.
	 */
	public composeTagsWithPopularTrend(
		originalIngredients: ReadonlyArray<TIngredientName>,
		extraIngredients: ReadonlyArray<TIngredientName>,
		originalRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		extraIngredientTags: ReadonlyArray<TIngredientTag>,
		popularTrend: IPopularTrend | null
	) {
		const resultTags = toSet(
			originalRecipePositiveTags,
			extraIngredientTags as TRecipeTag[]
		);
		const { isNegative: isNegativePopularTag, tag: currentPopularTag } =
			popularTrend ?? {};

		if (originalIngredients.length + extraIngredients.length >= 5) {
			resultTags.add(DYNAMIC_TAG_MAP.largePartition);
			if (currentPopularTag === DYNAMIC_TAG_MAP.largePartition) {
				resultTags.add(
					isNegativePopularTag
						? DYNAMIC_TAG_MAP.popularNegative
						: DYNAMIC_TAG_MAP.popularPositive
				);
			}
		}

		Object.entries(Recipe._tagCoverMap).forEach(
			([targetTag, coveredTag]) => {
				if (resultTags.has(targetTag as TRecipeTag)) {
					resultTags.delete(coveredTag);
					if (currentPopularTag === coveredTag) {
						resultTags.delete(
							isNegativePopularTag
								? DYNAMIC_TAG_MAP.popularNegative
								: DYNAMIC_TAG_MAP.popularPositive
						);
					}
				}
			}
		);

		return toArray(resultTags);
	}

	/**
	 * @description Get the suitability of a recipe for a customer based on their tags.
	 * @returns An object containing the suitability of the recipe and the tags that are common to both the recipe and the customer.
	 */
	public getCustomerSuitability(
		recipeTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags: ReadonlyArray<TRecipeTag> = []
	) {
		const { commonTags: negativeTags, count: negativeCount } =
			this.getCommonTags(recipeTags, customerNegativeTags);
		const { commonTags: positiveTags, count: positiveCount } =
			this.getCommonTags(recipeTags, customerPositiveTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	/**
	 * @description Calculate the suitability score change when adding or removing an extra ingredient from a recipe.
	 */
	public getIngredientScoreChange(
		oldRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		newRecipePositiveTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags: ReadonlyArray<TRecipeTag> = []
	) {
		const originalScore = this.calculateScore(
			oldRecipePositiveTags,
			customerNegativeTags,
			customerPositiveTags
		);
		const newScore = this.calculateScore(
			newRecipePositiveTags,
			customerNegativeTags,
			customerPositiveTags
		);

		return newScore - originalScore;
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
}
