import { isNil } from 'lodash';

import { getRecipeSourcePlaces } from '@/domain/catalog/queries/getRecipeSourcePlaces';
import { CUSTOMER_RARE_LIST } from '@/domain/data/customers/rare/records';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import { RECIPE_LIST } from '@/domain/data/recipes/records';
import type { IRecipe, IRecipeVariant } from '@/domain/data/recipes/schema';
import type { TRecipeName, TRecipes } from '@/domain/data/recipes/types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TIngredientTag, TRecipeTag } from '@/domain/data/tags/types';
import type { IMealRecipe, IResolvedMealRecipe } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { toSet } from '@/shared/utilities/collections/convert';
import { cloneJsonObject } from '@/shared/utilities/objects/cloneJsonObject';

import { Food } from './Food';
import { Ingredient } from './Ingredient';
import type {
	IProcessedRecipeVariant,
	TProcessedRecipe,
	TRecipe,
} from './types';

type TRecipeSuitabilityRowData = Omit<IProcessedRecipeVariant, 'id'> &
	Omit<TRecipe, 'recipes'> & {
		matchedNegativeTags?: TRecipeTag[];
		matchedPositiveTags: TRecipeTag[];
		recipeId: number;
		suitability: number;
	};

function createRecipeSuitabilityRow(
	recipe: TRecipe,
	variant: IProcessedRecipeVariant,
	matchedPositiveTags: TRecipeTag[],
	suitability: number,
	positiveTags: TRecipeTag[] = recipe.positiveTags,
	matchedNegativeTags?: TRecipeTag[]
): TRecipeSuitabilityRowData {
	const { recipes: _recipes, ...recipeData } = recipe;

	return {
		...recipeData,
		cooker: variant.cooker,
		cookTime: variant.cookTime,
		ingredients: variant.ingredients,
		...(matchedNegativeTags === undefined ? {} : { matchedNegativeTags }),
		matchedPositiveTags,
		positiveTags,
		recipeId: variant.id,
		suitability,
	};
}

export class Recipe extends Food<TProcessedRecipe[]> {
	private static _instance: Recipe | undefined;

	public static tagCoverMap = {
		[DYNAMIC_TAG_MAP.expensive]: DYNAMIC_TAG_MAP.economical,
		[DYNAMIC_TAG_MAP.largePartition]: '小巧',
		灼热: '凉爽',
		肉: '素',
		重油: '清淡',
		饱腹: '下酒',
	} as const satisfies Partial<Record<TRecipeTag, TRecipeTag>>;

	/**
	 * @description Apply the large partition tag when total ingredient count reaches 5.
	 * Also applies popular trend effect if the trend tag is `largePartition`.
	 */
	public static applyLargePartition(
		tagSet: Set<string>,
		totalIngredientCount: number,
		popularTrend: IPopularTrend | null
	) {
		if (totalIngredientCount >= 5) {
			tagSet.add(DYNAMIC_TAG_MAP.largePartition);
			if (popularTrend?.tag === DYNAMIC_TAG_MAP.largePartition) {
				tagSet.add(
					popularTrend.isNegative
						? DYNAMIC_TAG_MAP.popularNegative
						: DYNAMIC_TAG_MAP.popularPositive
				);
			}
		}
	}

	/**
	 * @description Apply tag cover rules: when a cover tag is present, remove the covered tag.
	 * Also removes popular trend effects if the covered tag matches the trend.
	 */
	public static applyTagCovers(
		tagSet: Set<TRecipeTag>,
		popularTrend: IPopularTrend | null
	) {
		const currentPopularTag = popularTrend?.tag;
		const isNegativePopularTag = popularTrend?.isNegative;

		Object.entries(Recipe.tagCoverMap).forEach(
			([targetTag, coveredTag]) => {
				if (tagSet.has(targetTag as TRecipeTag)) {
					tagSet.delete(coveredTag);
					if (currentPopularTag === coveredTag) {
						tagSet.delete(
							isNegativePopularTag
								? DYNAMIC_TAG_MAP.popularNegative
								: DYNAMIC_TAG_MAP.popularPositive
						);
					}
				}
			}
		);
	}

	/**
	 * @description Apply the famous shop signature effect: add `popularPositive` when the signature tag is present.
	 */
	public static applyFamousShop(tagSet: Set<string>, isFamousShop: boolean) {
		if (isFamousShop && tagSet.has(DYNAMIC_TAG_MAP.signature)) {
			tagSet.add(DYNAMIC_TAG_MAP.popularPositive);
		}
	}

	/**
	 * @description Apply the popular trend effect: add `popularPositive`/`popularNegative` when the trend tag is present.
	 */
	public static applyPopularTrend(
		tagSet: Set<string>,
		popularTrend: IPopularTrend
	) {
		if (popularTrend.tag !== null && tagSet.has(popularTrend.tag)) {
			tagSet.add(
				popularTrend.isNegative
					? DYNAMIC_TAG_MAP.popularNegative
					: DYNAMIC_TAG_MAP.popularPositive
			);
		}
	}

	private constructor(data: TRecipes) {
		const clonedData = cloneJsonObject(data);

		clonedData.forEach((item) => {
			const recipe = item as unknown as IRecipe;
			const { name, positiveTags, price, recipes } = recipe;

			if (name !== DARK_MATTER_META_MAP.name) {
				if (price > 60) {
					positiveTags.push(DYNAMIC_TAG_MAP.expensive);
				} else if (price < 20) {
					positiveTags.push(DYNAMIC_TAG_MAP.economical);
				}
			}

			const processedRecipes = recipes.map(
				({
					baseCookTime,
					...variant
				}: IRecipeVariant): IProcessedRecipeVariant => ({
					...variant,
					cookTime: {
						max: baseCookTime,
						min: Math.round(baseCookTime * 0.6 * 10) / 10,
					},
				})
			) as [IProcessedRecipeVariant, ...IProcessedRecipeVariant[]];

			Object.assign(recipe, {
				places: getRecipeSourcePlaces(recipe.from, CUSTOMER_RARE_LIST),
				recipes: processedRecipes,
			});
		});

		super(clonedData as unknown as TProcessedRecipe[], 'recipe');
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

	public getDefaultRecipeVariant(recipeName: TRecipeName) {
		return this.getPropsByName(recipeName, 'recipes')[0];
	}

	public getRecipeVariantById(recipeName: TRecipeName, recipeId: number) {
		const variant = this.getPropsByName(recipeName, 'recipes').find(
			({ id }) => id === recipeId
		);
		if (variant === undefined) {
			throw new Error(
				`[domain/catalog/food/Recipe]: recipe variant \`${recipeId}\` not found for \`${recipeName}\``
			);
		}

		return variant;
	}

	public isMealRecipe(data: unknown): data is IMealRecipe {
		if (data === null || typeof data !== 'object' || Array.isArray(data)) {
			return false;
		}

		const record = data as Record<string, unknown>;
		const keys = Object.keys(record);
		if (
			keys.length !== 3 ||
			!keys.includes('extraIngredients') ||
			!keys.includes('name') ||
			!keys.includes('recipeId') ||
			typeof record['name'] !== 'string' ||
			!Number.isSafeInteger(record['recipeId']) ||
			!Array.isArray(record['extraIngredients']) ||
			!record['extraIngredients'].every(
				(value) =>
					typeof value === 'string' &&
					Ingredient.getInstance().data.some(
						({ name }) => name === value
					)
			)
		) {
			return false;
		}

		const recipe = this.data.find(({ name }) => name === record['name']);
		if (recipe === undefined) {
			return false;
		}
		const variant = recipe.recipes.find(
			({ id }) => id === record['recipeId']
		);

		return (
			variant !== undefined &&
			variant.ingredients.length + record['extraIngredients'].length <= 5
		);
	}

	public resolveMealRecipe(recipeData: IMealRecipe): IResolvedMealRecipe {
		const variant = this.getRecipeVariantById(
			recipeData.name,
			recipeData.recipeId
		);

		return {
			baseIngredients: variant.ingredients,
			cooker: variant.cooker,
			cookTime: variant.cookTime,
			extraIngredients: recipeData.extraIngredients,
			name: recipeData.name,
			recipeId: recipeData.recipeId,
		};
	}

	/**
	 * @description Build raw recipe suitability rows for table consumers without applying query-layer filtering, sorting or pagination.
	 */
	public buildRecipeSuitabilityRows({
		customerNegativeTags,
		customerPositiveTags,
		getEasterEggScore,
		isFamousShop,
		popularTrend,
	}: {
		customerNegativeTags?: ReadonlyArray<TRecipeTag>;
		customerPositiveTags?: ReadonlyArray<TRecipeTag> | null;
		getEasterEggScore?: (
			recipe: TRecipe,
			variant: IProcessedRecipeVariant
		) => number | null | undefined;
		isFamousShop: boolean;
		popularTrend: IPopularTrend;
	}): TRecipeSuitabilityRowData[] {
		const data = this.data.filter(
			({ name }) => !this.blockedRecipes.has(name)
		);

		if (isNil(customerPositiveTags)) {
			return data.flatMap((recipe) =>
				recipe.recipes.map((variant) =>
					createRecipeSuitabilityRow(
						recipe,
						variant,
						[],
						0,
						recipe.positiveTags,
						customerNegativeTags === undefined ? undefined : []
					)
				)
			);
		}

		return data.flatMap((recipe) =>
			recipe.recipes.map((variant) => {
				const recipeTagsWithTrend = this.calculateTagsWithTrend(
					this.composeTagsWithPopularTrend(
						variant.ingredients,
						[],
						recipe.positiveTags,
						[],
						popularTrend
					),
					popularTrend,
					isFamousShop
				);
				const easterEggScore = getEasterEggScore?.(recipe, variant);

				if (!isNil(easterEggScore)) {
					return createRecipeSuitabilityRow(
						recipe,
						variant,
						[],
						easterEggScore > 0 ? Infinity : -Infinity,
						recipeTagsWithTrend,
						customerNegativeTags === undefined ? undefined : []
					);
				}

				const {
					negativeTags,
					positiveTags: matchedPositiveTags,
					suitability,
				} = this.getCustomerSuitability(
					recipeTagsWithTrend,
					customerPositiveTags,
					customerNegativeTags
				);

				return createRecipeSuitabilityRow(
					recipe,
					variant,
					matchedPositiveTags,
					suitability,
					recipeTagsWithTrend,
					customerNegativeTags === undefined
						? undefined
						: negativeTags
				);
			})
		);
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
			isDarkMatter: extraTags.some((tag) =>
				negativeTags.includes(tag as TRecipeTag)
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
		const resultTags = new Set<TRecipeTag>(originalRecipePositiveTags);
		for (const tag of extraIngredientTags) {
			resultTags.add(tag as TRecipeTag);
		}

		Recipe.applyLargePartition(
			resultTags,
			originalIngredients.length + extraIngredients.length,
			popularTrend
		);
		Recipe.applyTagCovers(resultTags, popularTrend);

		return [...resultTags];
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
