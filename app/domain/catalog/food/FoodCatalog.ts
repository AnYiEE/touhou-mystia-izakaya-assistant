import isNil from 'lodash/isNil.js';

import { getFoodSourceMapMetadata } from '@/domain/catalog/queries/getFoodSourceMapMetadata';
import { TaggedRecordCatalog } from '@/domain/catalog/shared/TaggedRecordCatalog';
import { FOOD_LIST } from '@/domain/data/foods/records';
import type { IFood, IRecipe } from '@/domain/data/foods/schema';
import type { TFoodId, TFoods, TRecipeId } from '@/domain/data/foods/types';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { IMealFood, IResolvedMealFood } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import { IngredientCatalog } from './IngredientCatalog';
import type { IProcessedRecipe, TFood, TProcessedFood, TRecipe } from './types';

export interface IRecipeOwner {
	food: TFood;
	recipe: TRecipe;
}

export type TFoodSuitabilityRowData = Omit<IProcessedRecipe, 'id'> &
	Omit<TFood, 'recipes'> & {
		matchedNegativeTags?: TFoodTagId[];
		matchedPositiveTags: TFoodTagId[];
		recipeId: TRecipeId;
		suitability: number;
	};

function createFoodSuitabilityRow(
	food: TFood,
	recipe: IProcessedRecipe,
	matchedPositiveTags: TFoodTagId[],
	suitability: number,
	positiveTags: TFoodTagId[] = food.positiveTags,
	matchedNegativeTags?: TFoodTagId[]
): TFoodSuitabilityRowData {
	const { recipes: _recipes, ...foodData } = food;

	return {
		...foodData,
		cookerType: recipe.cookerType,
		cookTime: recipe.cookTime,
		ingredients: recipe.ingredients,
		...(matchedNegativeTags === undefined ? {} : { matchedNegativeTags }),
		matchedPositiveTags,
		positiveTags,
		recipeId: recipe.id,
		suitability,
	};
}

/**
 * Owns food records and the category-scoped, globally unique recipe-ID index.
 */
export class FoodCatalog extends TaggedRecordCatalog<
	TProcessedFood[],
	TFoodTagId,
	TFood
> {
	public static readonly tagCoverMap = {
		[DYNAMIC_FOOD_TAG_MAP.expensive]: DYNAMIC_FOOD_TAG_MAP.economical,
		[DYNAMIC_FOOD_TAG_MAP.largePartition]: 28,
		0: 2,
		6: 7,
		9: 8,
		22: 21,
	} as const satisfies Partial<Record<TFoodTagId, TFoodTagId>>;

	private static _instance: FoodCatalog | undefined;

	public readonly blockedFoods: ReadonlySet<TFoodId> = new Set([-1]);
	public readonly blockedTags: ReadonlySet<TFoodTagId> = new Set([
		DARK_MATTER_META_MAP.positiveTag,
	]);

	private readonly _recipeOwnerById: Map<TRecipeId, IRecipeOwner>;

	private constructor(data: TFoods) {
		const clonedData = structuredClone(data) as unknown as IFood[];

		clonedData.forEach((food) => {
			const positiveTagSet = new Set(food.positiveTags);
			if (food.id !== -1) {
				if (food.price > 60) {
					positiveTagSet.add(DYNAMIC_FOOD_TAG_MAP.expensive);
				} else if (food.price < 20) {
					positiveTagSet.add(DYNAMIC_FOOD_TAG_MAP.economical);
				}
			}
			FoodCatalog.applyTagCovers(positiveTagSet, null);
			food.positiveTags = [...positiveTagSet].sort(numberSort);

			const processedRecipes = food.recipes.map(
				({ baseCookTime, ...recipe }: IRecipe): IProcessedRecipe => ({
					...recipe,
					cookTime: {
						max: baseCookTime,
						min: Math.round(baseCookTime * 0.6 * 10) / 10,
					},
				})
			) as [IProcessedRecipe, ...IProcessedRecipe[]];

			Object.assign(food, {
				...getFoodSourceMapMetadata(food.from, SPECIAL_GUEST_LIST),
				recipes: processedRecipes,
			});
		});

		super(clonedData as unknown as TProcessedFood[], 'food');

		this._recipeOwnerById = new Map();
		for (const food of this.data) {
			for (const recipe of food.recipes) {
				if (this._recipeOwnerById.has(recipe.id)) {
					throw new Error(
						`[domain/catalog/food/FoodCatalog]: duplicate recipe id \`${recipe.id}\``
					);
				}

				this._recipeOwnerById.set(recipe.id, { food, recipe });
			}
		}
	}

	public static getInstance() {
		if (FoodCatalog._instance !== undefined) {
			return FoodCatalog._instance;
		}

		const instance = new FoodCatalog(FOOD_LIST);

		FoodCatalog._instance = instance;

		return instance;
	}

	public static applyLargePartition(
		tagSet: Set<TFoodTagId>,
		totalIngredientCount: number,
		popularTrend: IPopularTrend | null
	) {
		if (totalIngredientCount >= 5) {
			tagSet.add(DYNAMIC_FOOD_TAG_MAP.largePartition);
			if (popularTrend?.tag === DYNAMIC_FOOD_TAG_MAP.largePartition) {
				tagSet.add(
					popularTrend.isNegative
						? DYNAMIC_FOOD_TAG_MAP.popularNegative
						: DYNAMIC_FOOD_TAG_MAP.popularPositive
				);
			}
		}
	}

	public static applyTagCovers(
		tagSet: Set<TFoodTagId>,
		popularTrend: IPopularTrend | null
	) {
		const currentPopularTag = popularTrend?.tag;
		const isNegativePopularTag = popularTrend?.isNegative;

		Object.entries(FoodCatalog.tagCoverMap).forEach(
			([targetTag, coveredTag]) => {
				if (tagSet.has(Number(targetTag) as TFoodTagId)) {
					tagSet.delete(coveredTag);
					if (currentPopularTag === coveredTag) {
						tagSet.delete(
							isNegativePopularTag
								? DYNAMIC_FOOD_TAG_MAP.popularNegative
								: DYNAMIC_FOOD_TAG_MAP.popularPositive
						);
					}
				}
			}
		);
	}

	public static applyFamousShop(
		tagSet: Set<TFoodTagId>,
		isFamousShop: boolean
	) {
		if (isFamousShop && tagSet.has(DYNAMIC_FOOD_TAG_MAP.signature)) {
			tagSet.add(DYNAMIC_FOOD_TAG_MAP.popularPositive);
		}
	}

	public static applyPopularTrend(
		tagSet: Set<TFoodTagId>,
		popularTrend: IPopularTrend
	) {
		if (popularTrend.tag !== null && tagSet.has(popularTrend.tag)) {
			tagSet.add(
				popularTrend.isNegative
					? DYNAMIC_FOOD_TAG_MAP.popularNegative
					: DYNAMIC_FOOD_TAG_MAP.popularPositive
			);
		}
	}

	public isMealFood(data: unknown): data is IMealFood {
		if (!checkIsRecord(data)) {
			return false;
		}

		const record = data;
		const keys = Object.keys(record);
		if (
			keys.length !== 2 ||
			!keys.includes('extraIngredients') ||
			!keys.includes('recipeId') ||
			!Number.isSafeInteger(record['recipeId']) ||
			!Array.isArray(record['extraIngredients']) ||
			!record['extraIngredients'].every(
				(value) =>
					typeof value === 'number' &&
					IngredientCatalog.getInstance().data.some(
						({ id }) => id === value
					)
			)
		) {
			return false;
		}

		const owner = this.findRecipeOwnerById(record['recipeId'] as TRecipeId);

		return (
			owner !== undefined &&
			owner.recipe.ingredients.length +
				record['extraIngredients'].length <=
				5
		);
	}

	public resolveMealFood(mealFood: IMealFood): IResolvedMealFood {
		const { food, recipe } = this.getRecipeOwnerById(mealFood.recipeId);

		return {
			baseIngredients: recipe.ingredients,
			cookerType: recipe.cookerType,
			cookTime: recipe.cookTime,
			extraIngredients: mealFood.extraIngredients,
			food: food.id,
			recipeId: mealFood.recipeId,
		};
	}

	public findRecipeOwnerById(recipeId: TRecipeId): IRecipeOwner | undefined {
		return this._recipeOwnerById.get(recipeId);
	}

	public getRecipeOwnerById(recipeId: TRecipeId): IRecipeOwner {
		const owner = this.findRecipeOwnerById(recipeId);
		if (owner === undefined) {
			throw new Error(
				`[domain/catalog/food/FoodCatalog]: recipe id \`${recipeId}\` not found`
			);
		}

		return owner;
	}

	public buildFoodSuitabilityRows({
		getEasterEggScore,
		guestNegativeTags,
		guestPositiveTags,
		isFamousShop,
		popularTrend,
	}: {
		getEasterEggScore?: (
			food: TFood,
			recipe: IProcessedRecipe
		) => number | null | undefined;
		guestNegativeTags?: ReadonlyArray<TFoodTagId>;
		guestPositiveTags?: ReadonlyArray<TFoodTagId> | null;
		isFamousShop: boolean;
		popularTrend: IPopularTrend;
	}): TFoodSuitabilityRowData[] {
		const data = this.data.filter(({ id }) => !this.blockedFoods.has(id));

		return data.flatMap((food) =>
			food.recipes.map((recipe) => {
				if (isNil(guestPositiveTags)) {
					return createFoodSuitabilityRow(
						food,
						recipe,
						[],
						0,
						food.positiveTags,
						guestNegativeTags === undefined ? undefined : []
					);
				}

				const foodTagsWithTrend = this.calculateFoodTagsWithTrend(
					this.composeFoodTagsWithPopularTrend(
						recipe.ingredients,
						[],
						food.positiveTags,
						[],
						popularTrend
					),
					popularTrend,
					isFamousShop
				);

				const easterEggScore = getEasterEggScore?.(food, recipe);

				if (!isNil(easterEggScore)) {
					return createFoodSuitabilityRow(
						food,
						recipe,
						[],
						easterEggScore > 0 ? Infinity : -Infinity,
						foodTagsWithTrend,
						guestNegativeTags === undefined ? undefined : []
					);
				}

				const {
					negativeTags,
					positiveTags: matchedPositiveTags,
					suitability,
				} = this.getGuestSuitabilityByTags(
					foodTagsWithTrend,
					guestPositiveTags,
					guestNegativeTags
				);

				return createFoodSuitabilityRow(
					food,
					recipe,
					matchedPositiveTags,
					suitability,
					foodTagsWithTrend,
					guestNegativeTags === undefined ? undefined : negativeTags
				);
			})
		);
	}

	public calculateFoodTagsWithTrend(
		foodTags: ReadonlyArray<TFoodTagId>,
		popularTrend: IPopularTrend,
		isFamousShop: boolean
	) {
		const tagSet = new Set(foodTags);
		FoodCatalog.applyFamousShop(tagSet, isFamousShop);
		FoodCatalog.applyPopularTrend(tagSet, popularTrend);

		return [...tagSet];
	}

	public checkDarkMatter(
		mealFood:
			| IMealFood
			| {
					extraIngredients: ReadonlyArray<TIngredientId>;
					negativeTags: ReadonlyArray<TFoodTagId>;
			  }
	) {
		const negativeTags =
			'recipeId' in mealFood
				? this.getRecipeOwnerById(mealFood.recipeId).food.negativeTags
				: mealFood.negativeTags;

		const ingredientCatalog = IngredientCatalog.getInstance();
		const extraTags = mealFood.extraIngredients.flatMap((extraIngredient) =>
			ingredientCatalog.getIngredientTags(extraIngredient)
		);

		return {
			extraTags,
			isDarkMatter: extraTags.some((tag) => negativeTags.includes(tag)),
		};
	}

	public composeFoodTagsWithPopularTrend(
		baseIngredients: ReadonlyArray<TIngredientId>,
		extraIngredients: ReadonlyArray<TIngredientId>,
		positiveFoodTags: ReadonlyArray<TFoodTagId>,
		extraIngredientTags: ReadonlyArray<TFoodTagId>,
		popularTrend: IPopularTrend | null
	) {
		const resultTags = new Set<TFoodTagId>(positiveFoodTags);
		for (const tag of extraIngredientTags) {
			resultTags.add(tag);
		}

		FoodCatalog.applyLargePartition(
			resultTags,
			baseIngredients.length + extraIngredients.length,
			popularTrend
		);
		FoodCatalog.applyTagCovers(resultTags, popularTrend);

		return [...resultTags];
	}

	public getGuestSuitabilityByTags(
		foodTags: ReadonlyArray<TFoodTagId>,
		guestPositiveTags: ReadonlyArray<TFoodTagId>,
		guestNegativeTags: ReadonlyArray<TFoodTagId> = []
	) {
		const { commonTags: negativeTags, count: negativeCount } =
			this.getCommonTags(foodTags, guestNegativeTags);
		const { commonTags: positiveTags, count: positiveCount } =
			this.getCommonTags(foodTags, guestPositiveTags);

		return {
			negativeTags,
			positiveTags,
			suitability: positiveCount - negativeCount,
		};
	}

	public getIngredientScoreChange(
		oldPositiveFoodTags: ReadonlyArray<TFoodTagId>,
		newPositiveFoodTags: ReadonlyArray<TFoodTagId>,
		guestPositiveTags: ReadonlyArray<TFoodTagId>,
		guestNegativeTags: ReadonlyArray<TFoodTagId> = []
	) {
		const originalScore = this.calculateScore(
			oldPositiveFoodTags,
			guestNegativeTags,
			guestPositiveTags
		);
		const newScore = this.calculateScore(
			newPositiveFoodTags,
			guestNegativeTags,
			guestPositiveTags
		);

		return newScore - originalScore;
	}

	private calculateScore(
		positiveFoodTags: ReadonlyArray<TFoodTagId>,
		guestNegativeTags: ReadonlyArray<TFoodTagId>,
		guestPositiveTags: ReadonlyArray<TFoodTagId>
	) {
		let score = 0;

		positiveFoodTags.forEach((tag) => {
			score -= Number(guestNegativeTags.includes(tag));
			score += Number(guestPositiveTags.includes(tag));
		});

		return score;
	}
}
