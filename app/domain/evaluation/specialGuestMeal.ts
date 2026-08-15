import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';

import type { TRatingKey } from './types';

const DARK_MATTER_RECIPE_ID: TRecipeId = -1;
const foodCatalog = FoodCatalog.getInstance();

export interface IEvaluateSpecialGuestMealParams {
	currentBeverageTags: ReadonlyArray<TBeverageTagId>;
	currentFoodTagsWithTrend: ReadonlyArray<TFoodTagId>;
	currentMealFood: IMealFood | null;
	currentSpecialGuest: TSpecialGuestId;
	currentSpecialGuestBeverageTags: ReadonlyArray<TBeverageTagId>;
	currentSpecialGuestNegativeTags: ReadonlyArray<TFoodTagId>;
	currentSpecialGuestOrder: IGuestOrder;
	currentSpecialGuestPositiveTags: ReadonlyArray<TFoodTagId>;
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
}

export type TCreateSpecialGuestMealEvaluatorParams = Pick<
	IEvaluateSpecialGuestMealParams,
	| 'currentBeverageTags'
	| 'currentSpecialGuestBeverageTags'
	| 'currentSpecialGuest'
	| 'currentSpecialGuestNegativeTags'
	| 'currentSpecialGuestOrder'
	| 'currentSpecialGuestPositiveTags'
	| 'hasMystiaCooker'
>;

export type TSpecialGuestMealEvaluatorParams = Pick<
	IEvaluateSpecialGuestMealParams,
	'currentFoodTagsWithTrend' | 'currentMealFood' | 'isDarkMatter'
>;

export type TSpecialGuestMealEvaluator = (
	params: TSpecialGuestMealEvaluatorParams
) => TRatingKey | null;

export interface ISpecialGuestMealEvaluatorFoodSideFacts {
	readonly firstMatchedPositiveTagCount: number;
	readonly matchedNegativeTagCount: number;
	readonly matchedPositiveTagCount: number;
	readonly tagCounts: ReadonlyMap<TFoodTagId, number>;
}

export interface ISpecialGuestMealEvaluatorFoodSideCache {
	resolve(
		currentFoodTagsWithTrend: ReadonlyArray<TFoodTagId>
	): ISpecialGuestMealEvaluatorFoodSideFacts;
}

export function getIngredientEasterEggTarget(
	specialGuest: TSpecialGuestId
): TIngredientId | null {
	switch (specialGuest) {
		case 1000:
			return 1000;
		case 1001:
			return 5000;
		default:
			return null;
	}
}

export function checkIngredientEasterEgg({
	currentExtraIngredients,
	currentFood,
	currentFoodIngredients,
	currentSpecialGuest,
	mealScore = 0,
}: {
	currentExtraIngredients: ReadonlyArray<TIngredientId>;
	currentFood: TFoodId;
	currentFoodIngredients: ReadonlyArray<TIngredientId>;
	currentSpecialGuest: TSpecialGuestId;
	mealScore?: number;
}): { ingredient: TIngredientId | null; score: number } {
	const noChanged = { ingredient: null, score: mealScore };

	if (currentFood === -1) {
		return noChanged;
	}

	const ingredient = getIngredientEasterEggTarget(currentSpecialGuest);
	if (
		ingredient === null ||
		(!currentFoodIngredients.includes(ingredient) &&
			!currentExtraIngredients.includes(ingredient))
	) {
		return noChanged;
	}

	switch (currentSpecialGuest) {
		case 1000:
			return { ingredient, score: Math.max(mealScore, 3) };
		case 1001:
			return { ingredient, score: Math.min(mealScore, 1) };
	}

	return noChanged;
}

export function checkFoodEasterEgg({
	currentFood,
	currentSpecialGuest,
	mealScore = 0,
}: {
	currentFood: TFoodId;
	currentSpecialGuest: TSpecialGuestId;
	mealScore?: number;
}): { food: TFoodId | null; score: number } {
	switch (currentSpecialGuest) {
		case 2006: {
			const food = 70;
			if (currentFood === food) {
				return { food, score: 0 };
			}
			break;
		}
		case 4008: {
			const food = 69;
			if (currentFood === food) {
				return { food, score: 4 };
			}
			break;
		}
		case 4001: {
			const food = -1;
			if (currentFood === food) {
				return { food, score: 3 };
			}
			break;
		}
		case 5001:
		case 5002: {
			const food = 4001;
			if (currentFood === food) {
				return { food, score: 0 };
			}
			break;
		}
		case 1003: {
			const food = 35;
			if (currentFood === food) {
				return { food, score: 3 };
			}
			break;
		}
		case 10: {
			const food = 5002;
			if (currentFood === food) {
				return { food, score: 4 };
			}
			break;
		}
	}

	return { food: null, score: mealScore };
}

function checkEasterEgg({
	currentExtraIngredients,
	currentFood,
	currentFoodIngredients,
	currentSpecialGuest,
	mealScore,
}: {
	currentExtraIngredients: ReadonlyArray<TIngredientId>;
	currentFood: TFoodId;
	currentFoodIngredients: ReadonlyArray<TIngredientId>;
	currentSpecialGuest: TSpecialGuestId;
	mealScore: number;
}) {
	switch (currentSpecialGuest) {
		case 1000:
		case 1001:
			return checkIngredientEasterEgg({
				currentExtraIngredients,
				currentFood,
				currentFoodIngredients,
				currentSpecialGuest,
				mealScore,
			}).score;
		case 10:
		case 1003:
		case 2006:
		case 4001:
		case 4008:
		case 5001:
		case 5002:
			return checkFoodEasterEgg({
				currentFood,
				currentSpecialGuest,
				mealScore,
			}).score;
	}

	return mealScore;
}

function getSpecialGuestRatingKey(mealScore: number): TRatingKey | null {
	if (mealScore <= 0) {
		return 'exbad';
	}

	switch (mealScore) {
		case 1:
			return 'bad';
		case 2:
			return 'norm';
		case 3:
			return 'good';
		case 4:
			return 'exgood';
	}

	return null;
}

function evaluateBeverageSide({
	currentBeverageTags,
	currentSpecialGuestBeverageTags,
	currentSpecialGuestOrder,
	hasMystiaCooker,
}: Pick<
	TCreateSpecialGuestMealEvaluatorParams,
	| 'currentBeverageTags'
	| 'currentSpecialGuestBeverageTags'
	| 'currentSpecialGuestOrder'
	| 'hasMystiaCooker'
>) {
	let firstMatchedTag: TBeverageTagId | undefined;
	let firstMatchedTagCount = 0;
	let matchedOrderedTagCount = 0;
	let matchedTagCount = 0;

	for (const tag of currentBeverageTags) {
		if (!currentSpecialGuestBeverageTags.includes(tag)) {
			continue;
		}

		matchedTagCount++;
		if (firstMatchedTag === undefined) {
			firstMatchedTag = tag;
			firstMatchedTagCount = 1;
		} else if (tag === firstMatchedTag) {
			firstMatchedTagCount++;
		}
		if (tag === currentSpecialGuestOrder.beverageTag) {
			matchedOrderedTagCount++;
		}
	}

	if (matchedTagCount === 0) {
		return 0;
	}
	if (hasMystiaCooker) {
		return 1 + matchedTagCount - firstMatchedTagCount;
	}

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedTagCount -
		matchedOrderedTagCount
	);
}

function buildFoodSideFacts({
	currentFoodTagsWithTrend,
	currentSpecialGuestNegativeTags,
	currentSpecialGuestPositiveTags,
}: Pick<
	IEvaluateSpecialGuestMealParams,
	| 'currentFoodTagsWithTrend'
	| 'currentSpecialGuestNegativeTags'
	| 'currentSpecialGuestPositiveTags'
>) {
	let firstMatchedPositiveTag: TFoodTagId | undefined;
	let firstMatchedPositiveTagCount = 0;
	let matchedNegativeTagCount = 0;
	let matchedPositiveTagCount = 0;
	const tagCounts = new Map<TFoodTagId, number>();

	for (const tag of currentFoodTagsWithTrend) {
		tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		if (currentSpecialGuestNegativeTags.includes(tag)) {
			matchedNegativeTagCount++;
		}
		if (!currentSpecialGuestPositiveTags.includes(tag)) {
			continue;
		}

		matchedPositiveTagCount++;
		if (firstMatchedPositiveTag === undefined) {
			firstMatchedPositiveTag = tag;
			firstMatchedPositiveTagCount = 1;
		} else if (tag === firstMatchedPositiveTag) {
			firstMatchedPositiveTagCount++;
		}
	}

	return {
		firstMatchedPositiveTagCount,
		matchedNegativeTagCount,
		matchedPositiveTagCount,
		tagCounts,
	};
}

function evaluateFoodSideFromFacts(
	{
		firstMatchedPositiveTagCount,
		matchedNegativeTagCount,
		matchedPositiveTagCount,
		tagCounts,
	}: ISpecialGuestMealEvaluatorFoodSideFacts,
	foodOrderTag: TFoodTagId | null,
	isFoodOrderPositive: boolean,
	hasMystiaCooker: boolean
) {
	if (matchedPositiveTagCount === 0) {
		return -matchedNegativeTagCount;
	}
	if (hasMystiaCooker) {
		return (
			1 +
			matchedPositiveTagCount -
			firstMatchedPositiveTagCount -
			matchedNegativeTagCount
		);
	}

	const matchedOrderedTagCount =
		foodOrderTag === null || !isFoodOrderPositive
			? 0
			: (tagCounts.get(foodOrderTag) ?? 0);

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedPositiveTagCount -
		matchedOrderedTagCount -
		matchedNegativeTagCount
	);
}

function evaluateFoodSide({
	currentFoodTagsWithTrend,
	currentSpecialGuestNegativeTags,
	currentSpecialGuestOrder,
	currentSpecialGuestPositiveTags,
	hasMystiaCooker,
}: Pick<
	IEvaluateSpecialGuestMealParams,
	| 'currentFoodTagsWithTrend'
	| 'currentSpecialGuestNegativeTags'
	| 'currentSpecialGuestOrder'
	| 'currentSpecialGuestPositiveTags'
	| 'hasMystiaCooker'
>) {
	let firstMatchedPositiveTag: TFoodTagId | undefined;
	let firstMatchedPositiveTagCount = 0;
	let matchedNegativeTagCount = 0;
	let matchedOrderedTagCount = 0;
	let matchedPositiveTagCount = 0;

	for (const tag of currentFoodTagsWithTrend) {
		if (currentSpecialGuestNegativeTags.includes(tag)) {
			matchedNegativeTagCount++;
		}
		if (!currentSpecialGuestPositiveTags.includes(tag)) {
			continue;
		}

		matchedPositiveTagCount++;
		if (firstMatchedPositiveTag === undefined) {
			firstMatchedPositiveTag = tag;
			firstMatchedPositiveTagCount = 1;
		} else if (tag === firstMatchedPositiveTag) {
			firstMatchedPositiveTagCount++;
		}
		if (tag === currentSpecialGuestOrder.foodTag) {
			matchedOrderedTagCount++;
		}
	}

	if (matchedPositiveTagCount === 0) {
		return -matchedNegativeTagCount;
	}
	if (hasMystiaCooker) {
		return (
			1 +
			matchedPositiveTagCount -
			firstMatchedPositiveTagCount -
			matchedNegativeTagCount
		);
	}

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedPositiveTagCount -
		matchedOrderedTagCount -
		matchedNegativeTagCount
	);
}

export function createSpecialGuestMealEvaluatorFoodSideCache({
	currentSpecialGuestNegativeTags,
	currentSpecialGuestPositiveTags,
}: Pick<
	TCreateSpecialGuestMealEvaluatorParams,
	'currentSpecialGuestNegativeTags' | 'currentSpecialGuestPositiveTags'
>): ISpecialGuestMealEvaluatorFoodSideCache {
	const cache = new WeakMap<
		ReadonlyArray<TFoodTagId>,
		ISpecialGuestMealEvaluatorFoodSideFacts
	>();

	return {
		resolve(currentFoodTagsWithTrend) {
			const cached = cache.get(currentFoodTagsWithTrend);
			if (cached !== undefined) {
				return cached;
			}

			const facts = buildFoodSideFacts({
				currentFoodTagsWithTrend,
				currentSpecialGuestNegativeTags,
				currentSpecialGuestPositiveTags,
			});
			cache.set(currentFoodTagsWithTrend, facts);

			return facts;
		},
	};
}

function combineMealScoreValues(
	beverageScore: number,
	foodScore: number,
	hasMystiaCooker: boolean,
	hasBeverageOrder: boolean,
	hasFoodOrder: boolean,
	matchesBeverageOrder: boolean,
	matchesFoodOrder: boolean,
	currentExtraIngredients: ReadonlyArray<TIngredientId>,
	currentFood: TFoodId,
	currentFoodIngredients: ReadonlyArray<TIngredientId>,
	currentSpecialGuest: TSpecialGuestId
) {
	let maxScore: number;

	if (!hasBeverageOrder && !hasFoodOrder && !hasMystiaCooker) {
		maxScore = 0;
	} else {
		const beverageMaxScore = hasMystiaCooker
			? 1
			: Number(matchesBeverageOrder);
		const foodMaxScore = hasMystiaCooker ? 1 : Number(matchesFoodOrder);
		maxScore =
			beverageMaxScore + foodMaxScore === 0
				? 1
				: 2 + beverageMaxScore + foodMaxScore;
	}

	let mealScore = Math.min(beverageScore + foodScore, maxScore);
	if (
		!hasMystiaCooker &&
		hasBeverageOrder &&
		hasFoodOrder &&
		matchesBeverageOrder &&
		matchesFoodOrder
	) {
		mealScore = Math.max(mealScore, 2);
	}

	mealScore = checkEasterEgg({
		currentExtraIngredients,
		currentFood,
		currentFoodIngredients,
		currentSpecialGuest,
		mealScore,
	});

	return getSpecialGuestRatingKey(mealScore);
}

function combineMealSides({
	beverageScore,
	currentExtraIngredients,
	currentFood,
	currentFoodIngredients,
	currentFoodTagsWithTrend,
	currentSpecialGuest,
	currentSpecialGuestOrder,
	doesBeverageMatchOrder,
	foodScore,
	hasMystiaCooker,
}: Pick<
	IEvaluateSpecialGuestMealParams,
	| 'currentFoodTagsWithTrend'
	| 'currentSpecialGuest'
	| 'currentSpecialGuestOrder'
	| 'hasMystiaCooker'
> & {
	readonly beverageScore: number;
	readonly currentExtraIngredients: ReadonlyArray<TIngredientId>;
	readonly currentFood: TFoodId;
	readonly currentFoodIngredients: ReadonlyArray<TIngredientId>;
	readonly doesBeverageMatchOrder: boolean;
	readonly foodScore: number;
}) {
	const { beverageTag: guestOrderBeverageTag, foodTag: guestOrderFoodTag } =
		currentSpecialGuestOrder;
	const matchesBeverageOrder =
		guestOrderBeverageTag !== null && doesBeverageMatchOrder;
	const matchesFoodOrder =
		guestOrderFoodTag !== null &&
		currentFoodTagsWithTrend.includes(guestOrderFoodTag);

	return combineMealScoreValues(
		beverageScore,
		foodScore,
		hasMystiaCooker,
		guestOrderBeverageTag !== null,
		guestOrderFoodTag !== null,
		matchesBeverageOrder,
		matchesFoodOrder,
		currentExtraIngredients,
		currentFood,
		currentFoodIngredients,
		currentSpecialGuest
	);
}

function createSpecialGuestMealEvaluatorInternal({
	currentBeverageTags,
	currentSpecialGuest,
	currentSpecialGuestBeverageTags,
	currentSpecialGuestNegativeTags,
	currentSpecialGuestOrder,
	currentSpecialGuestPositiveTags,
	hasMystiaCooker,
}: TCreateSpecialGuestMealEvaluatorParams): TSpecialGuestMealEvaluator {
	const beverageScoreWithMystiaCooker = evaluateBeverageSide({
		currentBeverageTags,
		currentSpecialGuestBeverageTags,
		currentSpecialGuestOrder,
		hasMystiaCooker: true,
	});
	const beverageScoreWithoutMystiaCooker = evaluateBeverageSide({
		currentBeverageTags,
		currentSpecialGuestBeverageTags,
		currentSpecialGuestOrder,
		hasMystiaCooker: false,
	});
	const doesBeverageMatchOrder =
		currentSpecialGuestOrder.beverageTag !== null &&
		currentBeverageTags.includes(currentSpecialGuestOrder.beverageTag);

	return ({
		currentFoodTagsWithTrend,
		currentMealFood,
		isDarkMatter,
	}: TSpecialGuestMealEvaluatorParams) => {
		if (currentBeverageTags.length === 0 || currentMealFood === null) {
			return null;
		}

		const effectiveHasMystiaCooker = isDarkMatter ? false : hasMystiaCooker;
		const effectiveRecipe = isDarkMatter
			? DARK_MATTER_RECIPE_ID
			: currentMealFood.recipeId;
		const effectiveFoodTagsWithTrend = isDarkMatter
			? [DARK_MATTER_META_MAP.positiveTag]
			: currentFoodTagsWithTrend;

		if (
			(currentSpecialGuestOrder.beverageTag === null ||
				currentSpecialGuestOrder.foodTag === null) &&
			!effectiveHasMystiaCooker
		) {
			return null;
		}
		const { food: effectiveFood, recipe: effectiveRecipeRecord } =
			foodCatalog.getRecipeOwnerById(effectiveRecipe);

		const beverageScore = effectiveHasMystiaCooker
			? beverageScoreWithMystiaCooker
			: beverageScoreWithoutMystiaCooker;
		const foodScore = isDarkMatter
			? 0
			: evaluateFoodSide({
					currentFoodTagsWithTrend: effectiveFoodTagsWithTrend,
					currentSpecialGuestNegativeTags,
					currentSpecialGuestOrder,
					currentSpecialGuestPositiveTags,
					hasMystiaCooker: effectiveHasMystiaCooker,
				});

		return combineMealSides({
			beverageScore,
			currentExtraIngredients: currentMealFood.extraIngredients,
			currentFood: effectiveFood.id,
			currentFoodIngredients: effectiveRecipeRecord.ingredients,
			currentFoodTagsWithTrend: effectiveFoodTagsWithTrend,
			currentSpecialGuest,
			currentSpecialGuestOrder,
			doesBeverageMatchOrder,
			foodScore,
			hasMystiaCooker: effectiveHasMystiaCooker,
		});
	};
}

export function createSpecialGuestMealEvaluator(
	params: TCreateSpecialGuestMealEvaluatorParams
): TSpecialGuestMealEvaluator {
	return createSpecialGuestMealEvaluatorInternal(params);
}

function createSpecialGuestMealEvaluatorWithFoodSideCacheInternal(
	params: TCreateSpecialGuestMealEvaluatorParams,
	foodSideCache: ISpecialGuestMealEvaluatorFoodSideCache
): TSpecialGuestMealEvaluator {
	const {
		currentBeverageTags,
		currentSpecialGuest,
		currentSpecialGuestBeverageTags,
		currentSpecialGuestOrder,
		currentSpecialGuestPositiveTags,
		hasMystiaCooker,
	} = params;
	const evaluateWithoutCache =
		createSpecialGuestMealEvaluatorInternal(params);
	const beverageOrderTag = currentSpecialGuestOrder.beverageTag;
	const foodOrderTag = currentSpecialGuestOrder.foodTag;
	const beverageScore = evaluateBeverageSide({
		currentBeverageTags,
		currentSpecialGuestBeverageTags,
		currentSpecialGuestOrder,
		hasMystiaCooker,
	});
	const hasBeverageOrder = beverageOrderTag !== null;
	const hasFoodOrder = foodOrderTag !== null;
	const isFoodOrderPositive =
		foodOrderTag !== null &&
		currentSpecialGuestPositiveTags.includes(foodOrderTag);
	const matchesBeverageOrder =
		beverageOrderTag !== null &&
		currentBeverageTags.includes(beverageOrderTag);

	return ({
		currentFoodTagsWithTrend,
		currentMealFood,
		isDarkMatter,
	}: TSpecialGuestMealEvaluatorParams) => {
		if (isDarkMatter) {
			return evaluateWithoutCache({
				currentFoodTagsWithTrend,
				currentMealFood,
				isDarkMatter,
			});
		}
		if (currentBeverageTags.length === 0 || currentMealFood === null) {
			return null;
		}
		if ((!hasBeverageOrder || !hasFoodOrder) && !hasMystiaCooker) {
			return null;
		}
		const { food: currentFood, recipe: currentRecipe } =
			foodCatalog.getRecipeOwnerById(currentMealFood.recipeId);

		const foodSideFacts = foodSideCache.resolve(currentFoodTagsWithTrend);
		const foodScore = evaluateFoodSideFromFacts(
			foodSideFacts,
			foodOrderTag,
			isFoodOrderPositive,
			hasMystiaCooker
		);
		const matchesFoodOrder =
			foodOrderTag !== null && foodSideFacts.tagCounts.has(foodOrderTag);

		return combineMealScoreValues(
			beverageScore,
			foodScore,
			hasMystiaCooker,
			hasBeverageOrder,
			hasFoodOrder,
			matchesBeverageOrder,
			matchesFoodOrder,
			currentMealFood.extraIngredients,
			currentFood.id,
			currentRecipe.ingredients,
			currentSpecialGuest
		);
	};
}

export function createSpecialGuestMealEvaluatorWithFoodSideCache(
	params: TCreateSpecialGuestMealEvaluatorParams,
	foodSideCache: ISpecialGuestMealEvaluatorFoodSideCache
): TSpecialGuestMealEvaluator {
	return createSpecialGuestMealEvaluatorWithFoodSideCacheInternal(
		params,
		foodSideCache
	);
}

export function evaluateSpecialGuestMeal({
	currentBeverageTags,
	currentFoodTagsWithTrend,
	currentMealFood,
	currentSpecialGuest,
	currentSpecialGuestBeverageTags,
	currentSpecialGuestNegativeTags,
	currentSpecialGuestOrder,
	currentSpecialGuestPositiveTags,
	hasMystiaCooker,
	isDarkMatter,
}: IEvaluateSpecialGuestMealParams) {
	return createSpecialGuestMealEvaluator({
		currentBeverageTags,
		currentSpecialGuest,
		currentSpecialGuestBeverageTags,
		currentSpecialGuestNegativeTags,
		currentSpecialGuestOrder,
		currentSpecialGuestPositiveTags,
		hasMystiaCooker,
	})({ currentFoodTagsWithTrend, currentMealFood, isDarkMatter });
}
