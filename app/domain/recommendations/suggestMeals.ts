import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { IProcessedRecipe } from '@/domain/catalog/food/types';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import {
	checkFoodEasterEgg,
	createSpecialGuestMealEvaluator,
	createSpecialGuestMealEvaluatorFoodSideCache,
	createSpecialGuestMealEvaluatorWithFoodSideCache,
	evaluateSpecialGuestMeal,
	getIngredientEasterEggTarget,
} from '@/domain/evaluation/specialGuestMeal';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	type IBoundedRuntimeCacheStats,
	createBoundedRuntimeCache,
} from '@/shared/utilities/cache/createBoundedRuntimeCache';

import {
	type IExactIngredientStateTable,
	buildExactIngredientStateTable,
	getExactIngredientStateTags,
} from './exactIngredientSearch';
import type { ISuggestMealsExecution } from './execution';
import {
	EMPTY_RECOMMENDATION_PRIORITY_METRICS,
	type IRecommendationPriorityMetrics,
	addRecommendationPriorityMetrics,
	compareRecommendationStrictMetrics,
	getRecommendationItemPriority,
} from './priority';
import {
	type IRecommendationSortProfileMetrics,
	type TRecommendationSortProfile,
	compareRecommendationSortProfileMetrics,
} from './sortProfiles';
import type {
	ISuggestIngredientPenaltyContext,
	ISuggestIngredientResourcePenalty,
	ISuggestParams,
	ISuggestedMeal,
} from './types';

type TCatalogData<TCatalog extends { readonly data: ReadonlyArray<unknown> }> =
	TCatalog['data'];

type TFoodCatalogItem = TCatalogData<FoodCatalog>[number];

interface IFoodRecipeCandidate {
	readonly food: TFoodCatalogItem;
	readonly recipe: IProcessedRecipe;
}

interface IPlanWeightMetrics extends IRecommendationSortProfileMetrics {
	readonly priority: IRecommendationPriorityMetrics;
	readonly score: number;
}

interface IScoredResult {
	meal: ISuggestedMeal;
	metrics: IPlanWeightMetrics;
	score: number;
}

const SCORE_MAP: Record<TRatingKey, number> = {
	bad: 1,
	exbad: 0,
	exgood: 4,
	good: 3,
	norm: 2,
};

const SUGGEST_INGREDIENT_RESOURCE_WEIGHTS = {
	acquisition: 0.45,
	level: 0.2,
	price: 0.35,
} as const;
const COOPERATIVE_SORT_RUN_SIZE = 128;
const EMPTY_INGREDIENT_SET: ReadonlySet<TIngredientId> = new Set();

async function stableSortWithExecution<T>(
	values: ReadonlyArray<T>,
	compare: (a: T, b: T) => number,
	execution: ISuggestMealsExecution
) {
	let runs: T[][] = [];

	for (
		let startIndex = 0;
		startIndex < values.length;
		startIndex += COOPERATIVE_SORT_RUN_SIZE
	) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		runs.push(
			values
				.slice(startIndex, startIndex + COOPERATIVE_SORT_RUN_SIZE)
				.sort(compare)
		);
	}

	while (runs.length > 1) {
		const mergedRuns: T[][] = [];
		for (let runIndex = 0; runIndex < runs.length; runIndex += 2) {
			const left = runs[runIndex] ?? [];
			const right = runs[runIndex + 1];
			if (right === undefined) {
				mergedRuns.push(left);
				continue;
			}

			const merged: T[] = [];
			let leftIndex = 0;
			let rightIndex = 0;
			while (leftIndex < left.length && rightIndex < right.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const leftValue = left[leftIndex];
				const rightValue = right[rightIndex];
				if (leftValue === undefined || rightValue === undefined) {
					break;
				}
				if (compare(leftValue, rightValue) <= 0) {
					merged.push(leftValue);
					leftIndex++;
				} else {
					merged.push(rightValue);
					rightIndex++;
				}
			}
			while (leftIndex < left.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const value = left[leftIndex++];
				if (value !== undefined) {
					merged.push(value);
				}
			}
			while (rightIndex < right.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const value = right[rightIndex++];
				if (value !== undefined) {
					merged.push(value);
				}
			}
			mergedRuns.push(merged);
		}
		runs = mergedRuns;
	}

	return runs[0] ?? [];
}

function computeMaxEase(easeMap: ReadonlyMap<number, number>) {
	return [...easeMap.values()].reduce(
		(max, ease) => (ease !== Infinity && ease > max ? ease : max),
		0
	);
}

function buildEaseMap<T extends number>(
	items: ReadonlyArray<{ id: T }>,
	priorityMap: ReadonlyMap<T, IRecommendationPriorityMetrics>
): { easeMap: Map<T, number>; maxEase: number } {
	const easeMap = new Map<T, number>(
		items.map((item): [T, number] => [
			item.id,
			priorityMap.get(item.id)?.acquisitionEase ?? 0,
		])
	);

	return { easeMap, maxEase: computeMaxEase(easeMap) };
}

function normalizeEase(
	id: number,
	easeMap: ReadonlyMap<number, number>,
	maxEase: number
) {
	const ease = easeMap.get(id) ?? 0;

	if (ease === Infinity) {
		return 1;
	}
	if (ease <= 0 || maxEase <= 0) {
		return 0.5;
	}

	return ease / maxEase;
}

function normalizeAcquisitionEase(ease: number, maxEase: number) {
	if (ease === Infinity) {
		return 1;
	}
	if (ease <= 0 || maxEase <= 0) {
		return 0.5;
	}

	return ease / maxEase;
}

function getSuggestIngredientAcquisitionPenalty(
	ingredient: TIngredientId,
	{ ingredientEaseMap, maxIngredientEase }: ISuggestIngredientPenaltyContext
) {
	return (
		30 *
		(1 - normalizeEase(ingredient, ingredientEaseMap, maxIngredientEase))
	);
}

function normalizeResourceMetric(value: number, min: number, max: number) {
	return max <= min ? 0 : (value - min) / (max - min);
}

function getSuggestIngredientResourcePenalty(
	ingredient: TIngredientId,
	context: ISuggestIngredientPenaltyContext
): ISuggestIngredientResourcePenalty {
	const { level: ingredientLevel, price: ingredientPrice } =
		IngredientCatalog.getInstance().getPropsById(ingredient);
	const acquisition =
		getSuggestIngredientAcquisitionPenalty(ingredient, context) / 30;
	const level = normalizeResourceMetric(
		ingredientLevel,
		context.minIngredientLevel,
		context.maxIngredientLevel
	);
	const price = normalizeResourceMetric(
		ingredientPrice,
		context.minIngredientPrice,
		context.maxIngredientPrice
	);

	return {
		acquisition,
		level,
		price,
		total:
			acquisition * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.acquisition +
			price * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.price +
			level * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.level,
	};
}

function getSuggestMealMaterialCost(
	baseIngredients: ReadonlyArray<TIngredientId>,
	extraIngredients: ReadonlyArray<TIngredientId>,
	context: ISuggestIngredientPenaltyContext
) {
	let cost = 0;
	for (const ingredient of baseIngredients) {
		cost +=
			1 + getSuggestIngredientResourcePenalty(ingredient, context).total;
	}
	for (const ingredient of extraIngredients) {
		cost +=
			1 + getSuggestIngredientResourcePenalty(ingredient, context).total;
	}

	return cost;
}

function buildSuggestIngredientPenaltyContext(
	ingredients: TCatalogData<IngredientCatalog>,
	priorityMap: ReadonlyMap<TIngredientId, IRecommendationPriorityMetrics>
): ISuggestIngredientPenaltyContext {
	const { easeMap, maxEase } = buildEaseMap<TIngredientId>(
		ingredients,
		priorityMap
	);
	let maxIngredientLevel = -Infinity;
	let maxIngredientPrice = -Infinity;
	let minIngredientLevel = Infinity;
	let minIngredientPrice = Infinity;

	for (const { level, price } of ingredients) {
		maxIngredientLevel = Math.max(maxIngredientLevel, level);
		maxIngredientPrice = Math.max(maxIngredientPrice, price);
		minIngredientLevel = Math.min(minIngredientLevel, level);
		minIngredientPrice = Math.min(minIngredientPrice, price);
	}

	if (ingredients.length === 0) {
		maxIngredientLevel = 0;
		maxIngredientPrice = 0;
		minIngredientLevel = 0;
		minIngredientPrice = 0;
	}

	return {
		ingredientEaseMap: easeMap,
		maxIngredientEase: maxEase,
		maxIngredientLevel,
		maxIngredientPrice,
		minIngredientLevel,
		minIngredientPrice,
	};
}

export function createSuggestIngredientPenaltyContext({
	hiddenDlcs,
	hiddenIngredients,
	specialGuest,
}: {
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	specialGuest: TSpecialGuestId;
}) {
	const ingredientCatalog = IngredientCatalog.getInstance();
	const specialGuestCatalog = SpecialGuestCatalog.getInstance();
	const { dlc: specialGuestDlc, maps: specialGuestMaps } =
		specialGuestCatalog.getPropsById(specialGuest);
	const ingredientPriorityMap = new Map<
		TIngredientId,
		IRecommendationPriorityMetrics
	>();
	const ingredients = ingredientCatalog.data.filter((item) => {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			guestDlc: specialGuestDlc,
			guestPlaces: specialGuestMaps,
			hiddenDlcs,
		});
		if (priority !== null) {
			ingredientPriorityMap.set(item.id, priority);
		}

		return (
			priority !== null &&
			!ingredientCatalog.blockedIngredients.has(item.id) &&
			!ingredientCatalog.blockedLevels.has(item.level) &&
			!hiddenIngredients.has(item.id) &&
			!item.tags.some((tag) => ingredientCatalog.blockedTags.has(tag))
		);
	});

	return buildSuggestIngredientPenaltyContext(
		ingredients,
		ingredientPriorityMap
	);
}

function createSuggestContext({
	cooker,
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	specialGuest,
}: ISuggestParams) {
	const beverageCatalog = BeverageCatalog.getInstance();
	const foodCatalog = FoodCatalog.getInstance();
	const ingredientCatalog = IngredientCatalog.getInstance();
	const specialGuestCatalog = SpecialGuestCatalog.getInstance();
	const selectedCookerTypes =
		cooker === null
			? null
			: CookerCatalog.getInstance().getPropsById(
					cooker,
					'availableTypes'
				);

	const {
		beverageTags: specialGuestBeverageTags,
		dlc: specialGuestDlc,
		enduranceLimit: specialGuestEnduranceLimit,
		maps: specialGuestMaps,
		negativeTags: specialGuestNegativeTags,
		positiveTags: specialGuestPositiveTags,
		price: specialGuestPrice,
	} = specialGuestCatalog.getPropsById(specialGuest);

	const [, budgetSoftMax] = specialGuestPrice;
	const budgetMax = Math.ceil(budgetSoftMax * specialGuestEnduranceLimit);

	const beveragePriorityMap = new Map<
		TBeverageId,
		IRecommendationPriorityMetrics
	>();
	const ingredientPriorityMap = new Map<
		TIngredientId,
		IRecommendationPriorityMetrics
	>();
	const foodPriorityMap = new Map<TFoodId, IRecommendationPriorityMetrics>();

	for (const item of beverageCatalog.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			guestDlc: specialGuestDlc,
			guestPlaces: specialGuestMaps,
			hiddenDlcs,
		});
		if (priority !== null) {
			beveragePriorityMap.set(item.id, priority);
		}
	}
	for (const item of ingredientCatalog.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			guestDlc: specialGuestDlc,
			guestPlaces: specialGuestMaps,
			hiddenDlcs,
		});
		if (priority !== null) {
			ingredientPriorityMap.set(item.id, priority);
		}
	}
	for (const item of foodCatalog.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			guestDlc: specialGuestDlc,
			guestPlaces: specialGuestMaps,
			hiddenDlcs,
		});
		if (priority !== null) {
			foodPriorityMap.set(item.id, priority);
		}
	}

	const baseGameBeverages = beverageCatalog.data.filter(
		({ id }) => beveragePriorityMap.has(id) && !hiddenBeverages.has(id)
	);

	const unavailableFoodIngredients = new Set(
		ingredientCatalog.data
			.filter(
				({ id }) =>
					!ingredientPriorityMap.has(id) || hiddenIngredients.has(id)
			)
			.map(({ id }) => id)
	);

	const baseGameFoodCandidates: IFoodRecipeCandidate[] = [];
	for (const food of foodCatalog.data) {
		if (
			!foodPriorityMap.has(food.id) ||
			foodCatalog.blockedFoods.has(food.id) ||
			hiddenFoods.has(food.id)
		) {
			continue;
		}
		for (const recipe of food.recipes) {
			if (
				recipe.ingredients.length <= 5 &&
				!recipe.ingredients.some((ingredient) =>
					unavailableFoodIngredients.has(ingredient)
				) &&
				(selectedCookerTypes === null ||
					(
						selectedCookerTypes as ReadonlyArray<
							typeof recipe.cookerType
						>
					).includes(recipe.cookerType))
			) {
				baseGameFoodCandidates.push({ food, recipe });
			}
		}
	}

	const baseGameIngredients = ingredientCatalog.data.filter(
		({ id, level, tags }) =>
			ingredientPriorityMap.has(id) &&
			!ingredientCatalog.blockedIngredients.has(id) &&
			!ingredientCatalog.blockedLevels.has(level) &&
			!hiddenIngredients.has(id) &&
			!tags.some((tag) => ingredientCatalog.blockedTags.has(tag))
	);

	const ingredientPenaltyContext = buildSuggestIngredientPenaltyContext(
		baseGameIngredients,
		ingredientPriorityMap
	);
	const { maxEase: maxBeverageEase } = buildEaseMap(
		baseGameBeverages,
		beveragePriorityMap
	);
	const foodAggregatePriorityMap = new Map<
		TRecipeId,
		IRecommendationPriorityMetrics
	>();
	for (const { food, recipe } of baseGameFoodCandidates) {
		let aggregate = foodPriorityMap.get(food.id);
		if (aggregate === undefined) {
			continue;
		}

		const ingredientEase: number[] = [];
		for (const ingredient of recipe.ingredients) {
			const ingredientPriority = ingredientPriorityMap.get(ingredient);
			if (ingredientPriority === undefined) {
				aggregate = undefined;
				break;
			}
			aggregate = addRecommendationPriorityMetrics(
				aggregate,
				ingredientPriority
			);
			ingredientEase.push(
				normalizeAcquisitionEase(
					ingredientPriority.acquisitionEase,
					ingredientPenaltyContext.maxIngredientEase
				)
			);
		}
		if (aggregate !== undefined) {
			foodAggregatePriorityMap.set(recipe.id, {
				...aggregate,
				acquisitionEase:
					ingredientEase.length === 0
						? 0.5
						: Math.min(...ingredientEase),
			});
		}
	}

	return {
		baseGameBeverages,
		baseGameFoodCandidates,
		baseGameIngredients,
		beverageCatalog,
		beveragePriorityMap,
		budgetMax,
		budgetSoftMax,
		fixedFoodAggregatePriorityMap: new Map<
			TRecipeId,
			IRecommendationPriorityMetrics
		>(),
		fixedItemPriorityMap: new WeakMap<
			object,
			IRecommendationPriorityMetrics
		>(),
		foodAggregatePriorityMap,
		foodCatalog,
		foodPriorityMap,
		hiddenDlcs,
		ingredientCatalog,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		maxBeverageEase,
		specialGuest,
		specialGuestBeverageTags,
		specialGuestDlc,
		specialGuestMaps,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	};
}

type TSuggestContext = ReturnType<typeof createSuggestContext>;

function getSuggestContextLogicalWeight(context: TSuggestContext) {
	return (
		context.baseGameBeverages.length +
		context.baseGameIngredients.length +
		context.baseGameFoodCandidates.length +
		context.beveragePriorityMap.size +
		context.foodAggregatePriorityMap.size +
		context.foodPriorityMap.size +
		context.ingredientPriorityMap.size
	);
}

interface IMealPriorityOptions {
	readonly fixedExtraIngredients: ReadonlySet<TIngredientId>;
	readonly isBeverageFixed: boolean;
	readonly isFoodFixed: boolean;
}

function getFixedItemPriority(
	item: {
		readonly availabilityPaths: TCatalogData<IngredientCatalog>[number]['availabilityPaths'];
		readonly dlc: TDlc;
	},
	context: TSuggestContext
) {
	const cached = context.fixedItemPriorityMap.get(item);
	if (cached !== undefined) {
		return cached;
	}

	const priority = getRecommendationItemPriority({
		allowFishingFallback: true,
		availabilityPaths: item.availabilityPaths,
		contentDlc: item.dlc,
		guestDlc: context.specialGuestDlc,
		guestPlaces: context.specialGuestMaps,
		hiddenDlcs: context.hiddenDlcs,
	});
	if (priority !== null) {
		context.fixedItemPriorityMap.set(item, priority);
	}

	return priority;
}

function requireItemPriority(
	item: {
		readonly availabilityPaths: TCatalogData<IngredientCatalog>[number]['availabilityPaths'];
		readonly dlc: TDlc;
	},
	context: TSuggestContext,
	isFixed: boolean,
	autoPriority?: IRecommendationPriorityMetrics
) {
	if (!isFixed && autoPriority !== undefined) {
		return autoPriority;
	}
	const priority = isFixed
		? getFixedItemPriority(item, context)
		: getRecommendationItemPriority({
				allowFishingFallback: false,
				availabilityPaths: item.availabilityPaths,
				contentDlc: item.dlc,
				guestDlc: context.specialGuestDlc,
				guestPlaces: context.specialGuestMaps,
				hiddenDlcs: context.hiddenDlcs,
			});
	if (priority === null) {
		throw new Error('推荐候选缺少合法的可获取路径');
	}

	return priority;
}

function checkFixedSelectionsAvailable(
	{ currentBeverage, currentFood }: ISuggestParams,
	context: TSuggestContext
) {
	if (currentBeverage !== null) {
		const beverage = context.beverageCatalog.getPropsById(currentBeverage);
		if (getFixedItemPriority(beverage, context) === null) {
			return false;
		}
	}
	if (currentFood === null) {
		return true;
	}

	const { food, recipe } = context.foodCatalog.getRecipeOwnerById(
		currentFood.recipeId
	);
	if (getFixedItemPriority(food, context) === null) {
		return false;
	}
	for (const ingredient of [
		...recipe.ingredients,
		...currentFood.extraIngredients,
	]) {
		const ingredientProps =
			context.ingredientCatalog.getPropsById(ingredient);
		if (getFixedItemPriority(ingredientProps, context) === null) {
			return false;
		}
	}

	return true;
}

function getFoodAggregatePriority(
	food: TFoodCatalogItem,
	recipe: IProcessedRecipe,
	context: TSuggestContext,
	isFixed: boolean
) {
	if (!isFixed) {
		const automatic = context.foodAggregatePriorityMap.get(recipe.id);
		if (automatic !== undefined) {
			return automatic;
		}
	}

	const cached = context.fixedFoodAggregatePriorityMap.get(recipe.id);
	if (cached !== undefined) {
		return cached;
	}

	let aggregate = requireItemPriority(
		food,
		context,
		isFixed,
		context.foodPriorityMap.get(food.id)
	);
	const ingredientEase: number[] = [];
	for (const ingredient of recipe.ingredients) {
		const ingredientProps =
			context.ingredientCatalog.getPropsById(ingredient);
		const ingredientPriority = requireItemPriority(
			ingredientProps,
			context,
			isFixed,
			context.ingredientPriorityMap.get(ingredient)
		);
		aggregate = addRecommendationPriorityMetrics(
			aggregate,
			ingredientPriority
		);
		ingredientEase.push(
			normalizeAcquisitionEase(
				ingredientPriority.acquisitionEase,
				context.ingredientPenaltyContext.maxIngredientEase
			)
		);
	}

	const result = {
		...aggregate,
		acquisitionEase:
			ingredientEase.length === 0 ? 0.5 : Math.min(...ingredientEase),
	};
	if (isFixed) {
		context.fixedFoodAggregatePriorityMap.set(recipe.id, result);
	}

	return result;
}

function getMealPriority(
	meal: ISuggestedMeal,
	context: TSuggestContext,
	{
		fixedExtraIngredients,
		isBeverageFixed,
		isFoodFixed,
	}: IMealPriorityOptions
) {
	const { food, recipe } = context.foodCatalog.getRecipeOwnerById(
		meal.food.recipeId
	);
	const beverage = context.beverageCatalog.getPropsById(meal.beverage);
	const foodPriority = getFoodAggregatePriority(
		food,
		recipe,
		context,
		isFoodFixed
	);
	const beveragePriority = requireItemPriority(
		beverage,
		context,
		isBeverageFixed,
		context.beveragePriorityMap.get(beverage.id)
	);
	let priority = addRecommendationPriorityMetrics(
		EMPTY_RECOMMENDATION_PRIORITY_METRICS,
		foodPriority
	);
	priority = addRecommendationPriorityMetrics(priority, beveragePriority);

	for (const ingredient of meal.food.extraIngredients) {
		const ingredientProps =
			context.ingredientCatalog.getPropsById(ingredient);
		priority = addRecommendationPriorityMetrics(
			priority,
			requireItemPriority(
				ingredientProps,
				context,
				fixedExtraIngredients.has(ingredient),
				context.ingredientPriorityMap.get(ingredientProps.id)
			)
		);
	}

	const beverageEase = normalizeAcquisitionEase(
		beveragePriority.acquisitionEase,
		context.maxBeverageEase
	);

	return {
		...priority,
		acquisitionEase: foodPriority.acquisitionEase + beverageEase,
	};
}

const SUGGEST_CONTEXT_CACHE_MAX_ENTRIES = 1000;
const SUGGEST_CONTEXT_CACHE_MAX_WEIGHT = 500_000;
const suggestContextCache = createBoundedRuntimeCache<string, TSuggestContext>(
	SUGGEST_CONTEXT_CACHE_MAX_ENTRIES,
	{
		getWeight: getSuggestContextLogicalWeight,
		maxWeight: SUGGEST_CONTEXT_CACHE_MAX_WEIGHT,
	}
);

function buildSuggestContextCacheKey({
	cooker,
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	specialGuest,
}: ISuggestParams) {
	return [
		cooker ?? '',
		specialGuest,
		[...hiddenBeverages].sort().join(','),
		[...hiddenDlcs].sort().join(','),
		[...hiddenIngredients].sort().join(','),
		[...hiddenFoods].sort().join(','),
	].join('|');
}

function getSuggestContext(params: ISuggestParams) {
	const cacheKey = buildSuggestContextCacheKey(params);
	const cached = suggestContextCache.get(cacheKey);

	if (cached !== undefined) {
		return cached;
	}

	const context = createSuggestContext(params);
	suggestContextCache.set(cacheKey, context);

	return context;
}

function buildRelevantTagSet(
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>,
	specialGuestNegativeTags: ReadonlyArray<TFoodTagId>,
	orderFoodTag: TFoodTagId | null
) {
	const keepTags = new Set<TFoodTagId>(specialGuestPositiveTags);

	if (orderFoodTag !== null) {
		keepTags.add(orderFoodTag);
	}

	Object.entries(FoodCatalog.tagCoverMap).forEach(
		([coverTag, coveredTag]) => {
			const normalizedCoverTag = Number(coverTag) as TFoodTagId;
			if (specialGuestNegativeTags.includes(normalizedCoverTag)) {
				keepTags.add(coveredTag);
			}
			if (specialGuestNegativeTags.includes(coveredTag)) {
				keepTags.add(normalizedCoverTag);
			}
		}
	);

	return keepTags;
}

function filterRelevantIngredients(
	baseGameIngredients: TCatalogData<IngredientCatalog>,
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>,
	specialGuestNegativeTags: ReadonlyArray<TFoodTagId>,
	orderFoodTag: TFoodTagId | null
): TCatalogData<IngredientCatalog> {
	const keepTags = buildRelevantTagSet(
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		orderFoodTag
	);

	return baseGameIngredients.filter(({ tags }) =>
		tags.some((tag) => keepTags.has(tag))
	);
}

interface IBeverageTagGroup {
	members: Array<{ id: TBeverageId; price: number }>;
	tags: TBeverageTagId[];
}

function buildFoodSuitabilityList(
	foodCatalog: FoodCatalog,
	baseGameFoodCandidates: ReadonlyArray<IFoodRecipeCandidate>,
	specialGuest: TSpecialGuestId,
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>,
	specialGuestNegativeTags: ReadonlyArray<TFoodTagId>,
	popularTrend: IPopularTrend,
	isFamousShop: boolean
) {
	const list = baseGameFoodCandidates.map(({ food, recipe }) => {
		const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
			foodCatalog.composeFoodTagsWithPopularTrend(
				recipe.ingredients,
				[],
				food.positiveTags,
				[],
				popularTrend
			),
			popularTrend,
			isFamousShop
		);

		const { score: easterEggScore } = checkFoodEasterEgg({
			currentFood: food.id,
			currentSpecialGuest: specialGuest,
		});

		const suitability =
			easterEggScore > 0
				? Infinity
				: easterEggScore < 0
					? -Infinity
					: foodCatalog.getGuestSuitabilityByTags(
							foodTagsWithTrend,
							specialGuestPositiveTags,
							specialGuestNegativeTags
						).suitability;

		return { food, foodTagsWithTrend, recipe, suitability };
	});

	list.sort((a, b) => b.suitability - a.suitability);

	return list;
}

function buildBeverageTagGroups(beverages: TCatalogData<BeverageCatalog>) {
	const groups = new Map<string, IBeverageTagGroup>();

	beverages.forEach(({ id, price, tags }) => {
		const tagKey = [...tags].sort().join(',');
		let group = groups.get(tagKey);
		if (group === undefined) {
			group = { members: [], tags };
			groups.set(tagKey, group);
		}
		group.members.push({ id, price });
	});

	return groups;
}

function comparePlanWeightMetrics(
	profile: TRecommendationSortProfile,
	a: IPlanWeightMetrics,
	b: IPlanWeightMetrics
) {
	return (
		b.score - a.score ||
		compareRecommendationSortProfileMetrics(
			profile,
			a,
			b,
			compareRecommendationStrictMetrics(a.priority, b.priority)
		)
	);
}

function checkSameDiversityLayer(
	left: IPlanWeightMetrics,
	right: IPlanWeightMetrics
) {
	return left.score === right.score;
}

interface IResultDiversityOptions {
	readonly isBeverageFixed: boolean;
	readonly isFoodFixed: boolean;
}

function findDiverseResultIndex(
	results: ReadonlyArray<IScoredResult>,
	seenBeverages: ReadonlySet<TBeverageId>,
	seenFoods: ReadonlySet<TFoodId>,
	{ isBeverageFixed, isFoodFixed }: IResultDiversityOptions
) {
	const highestLayer = results[0]?.metrics;
	let newBeverageIndex = -1;
	let newFoodIndex = -1;

	for (const [index, { meal, metrics }] of results.entries()) {
		if (
			highestLayer === undefined ||
			!checkSameDiversityLayer(metrics, highestLayer)
		) {
			break;
		}

		const isNewBeverage = !seenBeverages.has(meal.beverage);
		const food = FoodCatalog.getInstance().getRecipeOwnerById(
			meal.food.recipeId
		).food.id;
		const isNewFood = !seenFoods.has(food);

		if (isFoodFixed) {
			if (isNewBeverage) {
				return index;
			}
			continue;
		}
		if (isBeverageFixed) {
			if (isNewFood) {
				return index;
			}
			continue;
		}
		if (isNewFood && isNewBeverage) {
			return index;
		}
		if (isNewFood && newFoodIndex === -1) {
			newFoodIndex = index;
		}
		if (isNewBeverage && newBeverageIndex === -1) {
			newBeverageIndex = index;
		}
	}

	return newFoodIndex === -1
		? newBeverageIndex === -1
			? 0
			: newBeverageIndex
		: newFoodIndex;
}

async function selectScoredResults(
	results: IScoredResult[],
	maxResults: number,
	keyFn: (meal: ISuggestedMeal) => string,
	diversityOptions: IResultDiversityOptions,
	sortProfile: TRecommendationSortProfile,
	execution: ISuggestMealsExecution
) {
	const sortedResults = await stableSortWithExecution(
		results,
		(a, b) => comparePlanWeightMetrics(sortProfile, a.metrics, b.metrics),
		execution
	);

	const seen = new Set<string>();
	const dedupedResults: IScoredResult[] = [];

	for (const result of sortedResults) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const { meal } = result;
		const key = keyFn(meal);

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		dedupedResults.push(result);
	}

	const seenBeverages = new Set<TBeverageId>();
	const seenFoods = new Set<TFoodId>();
	const out: ISuggestedMeal[] = [];

	if (sortProfile !== 'availability-first') {
		for (const { meal } of dedupedResults) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}

			const food = FoodCatalog.getInstance().getRecipeOwnerById(
				meal.food.recipeId
			).food.id;
			const hasSeenRequiredItem = diversityOptions.isFoodFixed
				? seenBeverages.has(meal.beverage)
				: diversityOptions.isBeverageFixed
					? seenFoods.has(food)
					: seenBeverages.has(meal.beverage) || seenFoods.has(food);

			if (hasSeenRequiredItem) {
				continue;
			}

			out.push(meal);
			seenBeverages.add(meal.beverage);
			seenFoods.add(food);

			if (out.length >= maxResults) {
				break;
			}
		}

		return out;
	}

	const remainingResults = [...dedupedResults];

	while (out.length < maxResults && remainingResults.length > 0) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const resultIndex =
			out.length === 0
				? 0
				: findDiverseResultIndex(
						remainingResults,
						seenBeverages,
						seenFoods,
						diversityOptions
					);
		const [result] = remainingResults.splice(resultIndex, 1);
		if (result === undefined) {
			break;
		}

		out.push(result.meal);
		seenBeverages.add(result.meal.beverage);
		seenFoods.add(
			FoodCatalog.getInstance().getRecipeOwnerById(
				result.meal.food.recipeId
			).food.id
		);
	}

	return out;
}

interface IFoodIngredientSummary {
	readonly currentIngredients: ReadonlyArray<TIngredientId>;
	readonly duplicateIngredientCount: number;
	readonly extraIngredients: ReadonlyArray<TIngredientId>;
	readonly foodTagsWithTrend: ReadonlyArray<TFoodTagId>;
	readonly ingredientPenalty: number;
	readonly priority: IRecommendationPriorityMetrics;
}

const EXACT_INGREDIENT_STATE_CACHE_MAX_ENTRIES = 4000;
const EXACT_INGREDIENT_STATE_CACHE_MAX_STATES = 2_000_000;
const RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_ENTRIES = 20_000;
const RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_SUMMARIES = 300_000;
const exactIngredientStateCache = createBoundedRuntimeCache<
	string,
	IExactIngredientStateTable
>(EXACT_INGREDIENT_STATE_CACHE_MAX_ENTRIES, {
	getWeight: (table) => table.stateCount,
	maxWeight: EXACT_INGREDIENT_STATE_CACHE_MAX_STATES,
});
const recipeIngredientSummaryCache = createBoundedRuntimeCache<
	string,
	ReadonlyArray<ReadonlyArray<IFoodIngredientSummary>>
>(RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_ENTRIES, {
	getWeight: (layers) =>
		layers.reduce((total, layer) => total + layer.length, 0),
	maxWeight: RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_SUMMARIES,
});
const exactIngredientStateTableCacheKeys = new WeakMap<
	IExactIngredientStateTable,
	number
>();
let nextExactIngredientStateTableCacheKey = 1;

function getExactIngredientStateTableCacheKey(
	table: IExactIngredientStateTable
) {
	const cached = exactIngredientStateTableCacheKeys.get(table);
	if (cached !== undefined) {
		return cached;
	}

	const cacheKey = nextExactIngredientStateTableCacheKey++;
	exactIngredientStateTableCacheKeys.set(table, cacheKey);

	return cacheKey;
}

function buildExactIngredientStateCacheKey({
	candidates,
	maxCount,
	orderSensitiveTags = new Set<TFoodTagId>(),
}: {
	candidates: ReadonlyArray<{
		effectKeys: ReadonlyArray<string>;
		id: TIngredientId;
		penalty: number;
		priority: IRecommendationPriorityMetrics;
		tags: ReadonlyArray<TFoodTagId>;
	}>;
	maxCount: number;
	orderSensitiveTags?: ReadonlySet<TFoodTagId>;
}) {
	return [
		maxCount.toString(),
		[...orderSensitiveTags].join(','),
		candidates
			.map(
				({ effectKeys, id, penalty, priority, tags }) =>
					`${id}:${penalty}:${priority.contentMismatchCount}:${priority.pathMismatchCount}:${priority.primaryPlaceMismatchCount}:${priority.guestPlacesMismatchCount}:${priority.unknownSourceCount}:${priority.lateSourceCount}:${priority.maxLateTierDistance}:${priority.totalLateTierDistance}:${priority.acquisitionEase}:${tags.join(',')}:${effectKeys.join(',')}`
			)
			.join('|'),
	].join('::');
}

async function getExactIngredientStateTable(
	params: Parameters<typeof buildExactIngredientStateTable>[0],
	execution: ISuggestMealsExecution
) {
	const cacheKey = buildExactIngredientStateCacheKey(params);
	const cached = exactIngredientStateCache.get(cacheKey);

	if (cached !== undefined) {
		return cached;
	}

	const table = await buildExactIngredientStateTable(params, execution);
	execution.throwIfAborted();
	exactIngredientStateCache.set(cacheKey, table);

	return table;
}

async function getFoodIngredientSummaries({
	baseFoodTags,
	execution,
	extraSlots,
	food,
	isFamousShop,
	popularTrend,
	recipeId,
	recipeIngredients,
	stateTable,
}: {
	baseFoodTags: ReadonlyArray<TFoodTagId>;
	execution: ISuggestMealsExecution;
	extraSlots: number;
	food: TFoodId;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeId: TRecipeId;
	recipeIngredients: ReadonlyArray<TIngredientId>;
	stateTable: IExactIngredientStateTable;
}) {
	const cacheKey = [
		getExactIngredientStateTableCacheKey(stateTable).toString(),
		extraSlots.toString(),
		food.toString(),
		recipeId.toString(),
		recipeIngredients.join(','),
		baseFoodTags.join(','),
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
		isFamousShop ? '1' : '0',
	].join('|');
	const cached = recipeIngredientSummaryCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	const layers: IFoodIngredientSummary[][] = Array.from(
		{ length: extraSlots + 1 },
		() => []
	);
	for (let count = 1; count <= extraSlots; count++) {
		const summaries = layers[count];
		if (summaries === undefined) {
			continue;
		}

		for (const state of stateTable.layers[count] ?? []) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const tagSet = new Set<TFoodTagId>(baseFoodTags);
			for (const tag of getExactIngredientStateTags(
				stateTable,
				state
			) as ReadonlyArray<TFoodTagId>) {
				tagSet.add(tag);
			}

			FoodCatalog.applyLargePartition(
				tagSet,
				recipeIngredients.length + state.count,
				popularTrend
			);
			FoodCatalog.applyTagCovers(tagSet, popularTrend);
			FoodCatalog.applyFamousShop(tagSet, isFamousShop);
			FoodCatalog.applyPopularTrend(tagSet, popularTrend);

			summaries.push({
				currentIngredients: [
					...recipeIngredients,
					...state.extraIngredients,
				],
				duplicateIngredientCount: state.duplicateIngredientCount,
				extraIngredients: state.extraIngredients,
				foodTagsWithTrend: [...tagSet],
				ingredientPenalty: state.ingredientPenalty,
				priority: state.priority,
			});
		}
	}

	execution.throwIfAborted();
	recipeIngredientSummaryCache.set(cacheKey, layers);

	return layers;
}

interface IBestExtraIngredientsPreparation {
	readonly summaryLayers: Awaited<
		ReturnType<typeof getFoodIngredientSummaries>
	>;
}

interface IPrepareBestExtraIngredientsParams {
	readonly baseFoodTags: ReadonlyArray<TFoodTagId>;
	readonly baseGameIngredients: TCatalogData<IngredientCatalog>;
	readonly execution: ISuggestMealsExecution;
	readonly extraSlots: number;
	readonly food: TFoodId;
	readonly foodNegativeTags: ReadonlyArray<TFoodTagId>;
	readonly hasMystiaCooker: boolean;
	readonly ingredientPenaltyContext: ISuggestIngredientPenaltyContext;
	readonly ingredientPriorityMap: ReadonlyMap<
		TIngredientId,
		IRecommendationPriorityMetrics
	>;
	readonly isFamousShop: boolean;
	readonly popularTrend: IPopularTrend;
	readonly recipeId: TRecipeId;
	readonly recipeIngredients: ReadonlyArray<TIngredientId>;
	readonly specialGuest: TSpecialGuestId;
	readonly specialGuestPositiveTags: ReadonlyArray<TFoodTagId>;
}

interface ISelectBestExtraIngredientsParams {
	readonly evaluateFood: ReturnType<typeof createSpecialGuestMealEvaluator>;
	readonly execution: ISuggestMealsExecution;
	readonly extraSlots: number;
	readonly maxRating: number;
	readonly preparation: IBestExtraIngredientsPreparation;
	readonly recipeId: TRecipeId;
}

interface IFindBestExtraIngredientsParams extends IPrepareBestExtraIngredientsParams {
	readonly beverageTags: ReadonlyArray<TBeverageTagId>;
	readonly guestOrder: IGuestOrder;
	readonly maxRating: number;
	readonly specialGuestBeverageTags: ReadonlyArray<TBeverageTagId>;
	readonly specialGuestNegativeTags: ReadonlyArray<TFoodTagId>;
}

interface IBestExtraIngredientsResult {
	readonly extraIngredients: TIngredientId[];
	readonly ingredientPenalty: number;
	readonly priority: IRecommendationPriorityMetrics;
	readonly rating: TRatingKey;
	readonly score: number;
}

async function prepareBestExtraIngredients({
	baseFoodTags,
	baseGameIngredients,
	execution,
	extraSlots,
	food,
	foodNegativeTags,
	hasMystiaCooker,
	ingredientPenaltyContext,
	ingredientPriorityMap,
	isFamousShop,
	popularTrend,
	recipeId,
	recipeIngredients,
	specialGuest,
	specialGuestPositiveTags,
}: IPrepareBestExtraIngredientsParams): Promise<IBestExtraIngredientsPreparation> {
	const negativeTagSet = new Set<TFoodTagId>(foodNegativeTags);
	const effectIngredient = getIngredientEasterEggTarget(specialGuest);
	const candidates = baseGameIngredients.flatMap((ingredient) => {
		if (ingredient.tags.some((tag) => negativeTagSet.has(tag))) {
			return [];
		}
		const priority = ingredientPriorityMap.get(ingredient.id);
		if (priority === undefined) {
			throw new Error(
				`推荐食材 ID “${ingredient.id}”缺少已选择的可获取路径`
			);
		}

		return [
			{
				effectKeys:
					ingredient.id === effectIngredient
						? ['ingredient-easter-egg']
						: [],
				id: ingredient.id,
				penalty: getSuggestIngredientResourcePenalty(
					ingredient.id,
					ingredientPenaltyContext
				).total,
				priority: { ...priority, acquisitionEase: 0 },
				tags: ingredient.tags,
			},
		];
	});
	const stateTable = await getExactIngredientStateTable(
		{
			candidates,
			maxCount: Math.max(0, 5 - recipeIngredients.length),
			orderSensitiveTags: hasMystiaCooker
				? new Set(specialGuestPositiveTags)
				: new Set<TFoodTagId>(),
		},
		execution
	);
	const summaryLayers = await getFoodIngredientSummaries({
		baseFoodTags,
		execution,
		extraSlots,
		food,
		isFamousShop,
		popularTrend,
		recipeId,
		recipeIngredients,
		stateTable,
	});

	return { summaryLayers };
}

async function selectBestExtraIngredients({
	evaluateFood,
	execution,
	extraSlots,
	maxRating,
	preparation,
	recipeId,
}: ISelectBestExtraIngredientsParams): Promise<IBestExtraIngredientsResult | null> {
	let bestRating: TRatingKey | null = null;
	let bestScore = 0;
	let bestSummary: IFoodIngredientSummary | null = null;

	for (let count = 1; count <= extraSlots; count++) {
		for (const summary of preparation.summaryLayers[count] ?? []) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const rating = evaluateFood({
				currentFoodTagsWithTrend: summary.foodTagsWithTrend,
				currentMealFood: {
					extraIngredients: [...summary.extraIngredients],
					recipeId,
				},
				isDarkMatter: false,
			});
			if (rating === null) {
				continue;
			}

			const score = SCORE_MAP[rating];
			if (score > maxRating || score < bestScore) {
				continue;
			}
			if (score === bestScore && bestSummary !== null) {
				const duplicateIngredientComparison =
					summary.duplicateIngredientCount -
					bestSummary.duplicateIngredientCount;
				if (duplicateIngredientComparison > 0) {
					continue;
				}
				const priorityComparison = compareRecommendationStrictMetrics(
					summary.priority,
					bestSummary.priority
				);
				if (
					duplicateIngredientComparison === 0 &&
					(priorityComparison > 0 ||
						(priorityComparison === 0 &&
							summary.ingredientPenalty >=
								bestSummary.ingredientPenalty))
				) {
					continue;
				}
			}

			bestRating = rating;
			bestScore = score;
			bestSummary = summary;
		}
	}

	return bestSummary === null || bestRating === null
		? null
		: {
				extraIngredients: [...bestSummary.extraIngredients],
				ingredientPenalty: bestSummary.ingredientPenalty,
				priority: bestSummary.priority,
				rating: bestRating,
				score: bestScore,
			};
}

async function findBestExtraIngredients({
	beverageTags,
	guestOrder,
	hasMystiaCooker,
	maxRating,
	specialGuest,
	specialGuestBeverageTags,
	specialGuestNegativeTags,
	specialGuestPositiveTags,
	...preparationParams
}: IFindBestExtraIngredientsParams) {
	const preparation = await prepareBestExtraIngredients({
		hasMystiaCooker,
		specialGuest,
		specialGuestPositiveTags,
		...preparationParams,
	});
	const evaluateFood = createSpecialGuestMealEvaluator({
		currentBeverageTags: beverageTags,
		currentSpecialGuest: specialGuest,
		currentSpecialGuestBeverageTags: specialGuestBeverageTags,
		currentSpecialGuestNegativeTags: specialGuestNegativeTags,
		currentSpecialGuestOrder: guestOrder,
		currentSpecialGuestPositiveTags: specialGuestPositiveTags,
		hasMystiaCooker,
	});

	return selectBestExtraIngredients({
		evaluateFood,
		execution: preparationParams.execution,
		extraSlots: preparationParams.extraSlots,
		maxRating,
		preparation,
		recipeId: preparationParams.recipeId,
	});
}

interface IAutomaticSuggestContextBatchState {
	readonly beverageTagGroups: Map<
		TBeverageTagId,
		Map<string, IBeverageTagGroup>
	>;
	readonly extraIngredientPreparations: Map<
		TCatalogData<IngredientCatalog>,
		Map<string, IBestExtraIngredientsPreparation>
	>;
	readonly foodSideCache: ReturnType<
		typeof createSpecialGuestMealEvaluatorFoodSideCache
	>;
	readonly foodsWithSuitability: Map<
		string,
		ReturnType<typeof buildFoodSuitabilityList>
	>;
	readonly relevantIngredientGroups: Map<
		string,
		TCatalogData<IngredientCatalog>
	>;
	readonly relevantIngredients: Map<
		TFoodTagId,
		TCatalogData<IngredientCatalog>
	>;
}

interface IAutomaticSuggestBatchState {
	readonly contexts: Map<TSuggestContext, IAutomaticSuggestContextBatchState>;
}

function createAutomaticSuggestBatchState(): IAutomaticSuggestBatchState {
	return { contexts: new Map() };
}

function getAutomaticSuggestContextBatchState(
	batchState: IAutomaticSuggestBatchState,
	context: TSuggestContext
) {
	const cached = batchState.contexts.get(context);
	if (cached !== undefined) {
		return cached;
	}

	const state: IAutomaticSuggestContextBatchState = {
		beverageTagGroups: new Map(),
		extraIngredientPreparations: new Map(),
		foodSideCache: createSpecialGuestMealEvaluatorFoodSideCache({
			currentSpecialGuestNegativeTags: context.specialGuestNegativeTags,
			currentSpecialGuestPositiveTags: context.specialGuestPositiveTags,
		}),
		foodsWithSuitability: new Map(),
		relevantIngredientGroups: new Map(),
		relevantIngredients: new Map(),
	};
	batchState.contexts.set(context, state);

	return state;
}

function getAutomaticBeverageTagGroups(
	context: TSuggestContext,
	state: IAutomaticSuggestContextBatchState,
	orderBeverageTag: TBeverageTagId
) {
	const cached = state.beverageTagGroups.get(orderBeverageTag);
	if (cached !== undefined) {
		return cached;
	}

	const groups = buildBeverageTagGroups(
		context.baseGameBeverages.filter(
			({ tags }) =>
				(tags as ReadonlyArray<TBeverageTagId>).includes(
					orderBeverageTag
				) &&
				(
					context.specialGuestBeverageTags as ReadonlyArray<TBeverageTagId>
				).includes(orderBeverageTag)
		)
	);
	state.beverageTagGroups.set(orderBeverageTag, groups);

	return groups;
}

function getAutomaticRelevantIngredients(
	context: TSuggestContext,
	state: IAutomaticSuggestContextBatchState,
	orderFoodTag: TFoodTagId
) {
	const cached = state.relevantIngredients.get(orderFoodTag);
	if (cached !== undefined) {
		return cached;
	}

	const ingredients = filterRelevantIngredients(
		context.baseGameIngredients,
		context.specialGuestPositiveTags,
		context.specialGuestNegativeTags,
		orderFoodTag
	);
	const signature = JSON.stringify(ingredients.map(({ id }) => id));
	const sharedIngredients =
		state.relevantIngredientGroups.get(signature) ?? ingredients;
	state.relevantIngredientGroups.set(signature, sharedIngredients);
	state.relevantIngredients.set(orderFoodTag, sharedIngredients);

	return sharedIngredients;
}

function getAutomaticFoodsWithSuitability(
	context: TSuggestContext,
	state: IAutomaticSuggestContextBatchState,
	specialGuest: TSpecialGuestId,
	isFamousShop: boolean,
	popularTrend: IPopularTrend
) {
	const key = [
		isFamousShop ? '1' : '0',
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
	].join('|');
	const cached = state.foodsWithSuitability.get(key);
	if (cached !== undefined) {
		return cached;
	}

	const foods = buildFoodSuitabilityList(
		context.foodCatalog,
		context.baseGameFoodCandidates,
		specialGuest,
		context.specialGuestPositiveTags,
		context.specialGuestNegativeTags,
		popularTrend,
		isFamousShop
	);
	state.foodsWithSuitability.set(key, foods);

	return foods;
}

async function getAutomaticExtraIngredientPreparation({
	candidate,
	context,
	execution,
	extraSlots,
	isFamousShop,
	popularTrend,
	relevantIngredients,
	state,
}: {
	candidate: IFoodRecipeCandidate;
	context: TSuggestContext;
	execution: ISuggestMealsExecution;
	extraSlots: number;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	relevantIngredients: TCatalogData<IngredientCatalog>;
	state: IAutomaticSuggestContextBatchState;
}) {
	const { food, recipe } = candidate;
	let preparations =
		state.extraIngredientPreparations.get(relevantIngredients);
	if (preparations === undefined) {
		preparations = new Map();
		state.extraIngredientPreparations.set(
			relevantIngredients,
			preparations
		);
	}
	const key = [
		food.id.toString(),
		recipe.id.toString(),
		extraSlots.toString(),
		isFamousShop ? '1' : '0',
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
	].join('|');
	const cached = preparations.get(key);
	if (cached !== undefined) {
		return cached;
	}

	const preparation = await prepareBestExtraIngredients({
		baseFoodTags: food.positiveTags,
		baseGameIngredients: relevantIngredients,
		execution,
		extraSlots,
		food: food.id,
		foodNegativeTags: food.negativeTags,
		hasMystiaCooker: false,
		ingredientPenaltyContext: context.ingredientPenaltyContext,
		ingredientPriorityMap: context.ingredientPriorityMap,
		isFamousShop,
		popularTrend,
		recipeId: recipe.id,
		recipeIngredients: recipe.ingredients,
		specialGuest: context.specialGuest,
		specialGuestPositiveTags: context.specialGuestPositiveTags,
	});
	execution.throwIfAborted();
	preparations.set(key, preparation);

	return preparation;
}

async function computeSuggestions(
	{
		guestOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		sortProfile,
		specialGuest,
	}: ISuggestParams,
	context: TSuggestContext,
	execution: ISuggestMealsExecution,
	batchState: IAutomaticSuggestBatchState
) {
	const {
		budgetMax,
		budgetSoftMax,
		ingredientPenaltyContext,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	} = context;
	const { beverageTag: orderBeverageTag, foodTag: orderFoodTag } = guestOrder;
	if (orderBeverageTag === null || orderFoodTag === null || hasMystiaCooker) {
		return [];
	}

	const contextBatchState = getAutomaticSuggestContextBatchState(
		batchState,
		context
	);
	const relevantIngredients = getAutomaticRelevantIngredients(
		context,
		contextBatchState,
		orderFoodTag
	);
	const foodsWithSuitability = getAutomaticFoodsWithSuitability(
		context,
		contextBatchState,
		specialGuest,
		isFamousShop,
		popularTrend
	);
	const results: IScoredResult[] = [];
	const beverageTagGroups = getAutomaticBeverageTagGroups(
		context,
		contextBatchState,
		orderBeverageTag
	);
	const beverageGroupsWithEvaluators = [...beverageTagGroups.values()].map(
		(group) => ({
			...group,
			evaluateFood: createSpecialGuestMealEvaluatorWithFoodSideCache(
				{
					currentBeverageTags: group.tags,
					currentSpecialGuest: specialGuest,
					currentSpecialGuestBeverageTags: specialGuestBeverageTags,
					currentSpecialGuestNegativeTags: specialGuestNegativeTags,
					currentSpecialGuestOrder: guestOrder,
					currentSpecialGuestPositiveTags: specialGuestPositiveTags,
					hasMystiaCooker: false,
				},
				contextBatchState.foodSideCache
			),
		})
	);

	for (const {
		food,
		food: { price: foodPrice },
		foodTagsWithTrend,
		recipe,
		recipe: { id: recipeId, ingredients: recipeIngredients },
	} of foodsWithSuitability) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);

		for (const {
			evaluateFood,
			members: beverageMembers,
		} of beverageGroupsWithEvaluators) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const rating = evaluateFood({
				currentFoodTagsWithTrend: foodTagsWithTrend,
				currentMealFood: { extraIngredients: [], recipeId },
				isDarkMatter: false,
			});

			if (rating === null) {
				continue;
			}

			const score = SCORE_MAP[rating];

			let finalScore = score;
			let finalRating: TRatingKey = rating;
			let finalExtraIngredients: TIngredientId[] = [];
			let ingredientPenalty = 0;

			if (extraSlots > 0 && (score < 4 || score > maxRating)) {
				const preparation =
					await getAutomaticExtraIngredientPreparation({
						candidate: { food, recipe },
						context,
						execution,
						extraSlots,
						isFamousShop,
						popularTrend,
						relevantIngredients,
						state: contextBatchState,
					});
				const bestExtra = await selectBestExtraIngredients({
					evaluateFood,
					execution,
					extraSlots,
					maxRating,
					preparation,
					recipeId,
				});

				if (
					bestExtra !== null &&
					(bestExtra.score > score || score > maxRating)
				) {
					finalScore = bestExtra.score;
					finalRating = bestExtra.rating;
					finalExtraIngredients = bestExtra.extraIngredients;
					ingredientPenalty = bestExtra.ingredientPenalty;
				}
			}

			if (finalScore <= maxRating) {
				const materialCost = getSuggestMealMaterialCost(
					recipeIngredients,
					finalExtraIngredients,
					ingredientPenaltyContext
				);
				for (const {
					id: beverage,
					price: beveragePrice,
				} of beverageMembers) {
					const totalPrice = beveragePrice + foodPrice;
					if (totalPrice > budgetMax) {
						continue;
					}

					const meal: ISuggestedMeal = {
						beverage,
						food: {
							extraIngredients: finalExtraIngredients,
							recipeId,
						},
						price: totalPrice,
						rating: finalRating,
					};
					const priority = getMealPriority(meal, context, {
						fixedExtraIngredients: EMPTY_INGREDIENT_SET,
						isBeverageFixed: false,
						isFoodFixed: false,
					});
					const { acquisitionEase } = priority;

					results.push({
						meal,
						metrics: {
							acquisitionEase,
							extraIngredientPenalty: ingredientPenalty,
							isOverSoftBudget: totalPrice > budgetSoftMax,
							materialCost,
							price: totalPrice,
							priority,
							score: finalScore,
						},
						score: finalScore,
					});
				}
			}
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) =>
			`${m.food.recipeId}|${m.beverage}|${m.food.extraIngredients.join(',')}`,
		{ isBeverageFixed: false, isFoodFixed: false },
		sortProfile,
		execution
	);
}

async function suggestIngredients(
	{
		guestOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		popularTrend,
		specialGuest,
	}: ISuggestParams,
	context: TSuggestContext,
	currentFood: IMealFood,
	currentBeverage: TBeverageId,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameIngredients,
		beverageCatalog,
		budgetMax,
		foodCatalog,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	} = context;
	const { foodTag: orderFoodTag } = guestOrder;

	const { price: beveragePrice, tags: beverageTags } =
		beverageCatalog.getPropsById(currentBeverage);

	const { food: foodRecord, recipe } = foodCatalog.getRecipeOwnerById(
		currentFood.recipeId
	);
	const {
		id: food,
		negativeTags: foodNegativeTags,
		positiveTags: foodPositiveTags,
		price: foodPrice,
	} = foodRecord;
	const { ingredients: recipeIngredients } = recipe;

	const allCurrentIngredients = [
		...recipeIngredients,
		...currentFood.extraIngredients,
	];
	const extraSlots =
		maxExtraIngredients === null
			? 5 - allCurrentIngredients.length
			: Math.min(
					5 - allCurrentIngredients.length,
					maxExtraIngredients - currentFood.extraIngredients.length
				);

	if (extraSlots <= 0) {
		return [];
	}

	const { extraTags: existingExtraTags, isDarkMatter: isBaseDarkMatter } =
		foodCatalog.checkDarkMatter({
			extraIngredients: currentFood.extraIngredients,
			negativeTags: foodNegativeTags,
		});

	if (isBaseDarkMatter) {
		return [];
	}

	const composedBaseFoodTags = foodCatalog.composeFoodTagsWithPopularTrend(
		recipeIngredients,
		currentFood.extraIngredients,
		foodPositiveTags,
		existingExtraTags,
		popularTrend
	);
	const baseFoodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
		composedBaseFoodTags,
		popularTrend,
		isFamousShop
	);

	const baseRating = evaluateSpecialGuestMeal({
		currentBeverageTags: beverageTags,
		currentFoodTagsWithTrend: baseFoodTagsWithTrend,
		currentMealFood: currentFood,
		currentSpecialGuest: specialGuest,
		currentSpecialGuestBeverageTags: specialGuestBeverageTags,
		currentSpecialGuestNegativeTags: specialGuestNegativeTags,
		currentSpecialGuestOrder: guestOrder,
		currentSpecialGuestPositiveTags: specialGuestPositiveTags,
		hasMystiaCooker,
		isDarkMatter: false,
	});

	const baseScore = baseRating === null ? 0 : SCORE_MAP[baseRating];

	if (baseScore >= 4 && baseScore <= maxRating) {
		return [];
	}

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		orderFoodTag
	);

	const bestExtra = await findBestExtraIngredients({
		baseFoodTags: composedBaseFoodTags,
		baseGameIngredients: relevantIngredients,
		beverageTags,
		execution,
		extraSlots,
		food,
		foodNegativeTags,
		guestOrder,
		hasMystiaCooker,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		isFamousShop,
		maxRating,
		popularTrend,
		recipeId: currentFood.recipeId,
		recipeIngredients: allCurrentIngredients,
		specialGuest,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	});

	if (
		bestExtra !== null &&
		(bestExtra.score > baseScore || baseScore > maxRating) &&
		bestExtra.score <= maxRating
	) {
		const totalPrice = beveragePrice + foodPrice;
		if (totalPrice > budgetMax) {
			return [];
		}

		const allExtra = [
			...currentFood.extraIngredients,
			...bestExtra.extraIngredients,
		];

		return [
			{
				beverage: currentBeverage,
				food: {
					extraIngredients: allExtra,
					recipeId: currentFood.recipeId,
				},
				price: totalPrice,
				rating: bestExtra.rating,
			},
		];
	}

	return [];
}

async function suggestForBeverage(
	{
		guestOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		sortProfile,
		specialGuest,
	}: ISuggestParams,
	context: TSuggestContext,
	currentBeverage: TBeverageId,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameFoodCandidates,
		baseGameIngredients,
		beverageCatalog,
		budgetMax,
		budgetSoftMax,
		foodCatalog,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	} = context;
	const { foodTag: orderFoodTag } = guestOrder;

	const { price: beveragePrice, tags: beverageTags } =
		beverageCatalog.getPropsById(currentBeverage);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		orderFoodTag
	);

	const foodsWithSuitability = buildFoodSuitabilityList(
		foodCatalog,
		baseGameFoodCandidates,
		specialGuest,
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		popularTrend,
		isFamousShop
	);

	const results: IScoredResult[] = [];

	for (const {
		food: {
			id: food,
			negativeTags: foodNegativeTags,
			positiveTags: foodPositiveTags,
			price: foodPrice,
		},
		foodTagsWithTrend,
		recipe: { id: recipeId, ingredients: recipeIngredients },
	} of foodsWithSuitability) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const rating = evaluateSpecialGuestMeal({
			currentBeverageTags: beverageTags,
			currentFoodTagsWithTrend: foodTagsWithTrend,
			currentMealFood: { extraIngredients: [], recipeId },
			currentSpecialGuest: specialGuest,
			currentSpecialGuestBeverageTags: specialGuestBeverageTags,
			currentSpecialGuestNegativeTags: specialGuestNegativeTags,
			currentSpecialGuestOrder: guestOrder,
			currentSpecialGuestPositiveTags: specialGuestPositiveTags,
			hasMystiaCooker,
			isDarkMatter: false,
		});

		if (rating === null) {
			continue;
		}

		let score = SCORE_MAP[rating];
		let bestMeal: ISuggestedMeal = {
			beverage: currentBeverage,
			food: { extraIngredients: [], recipeId },
			price: beveragePrice + foodPrice,
			rating,
		};

		let ingredientPenalty = 0;
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);
		if (extraSlots > 0 && (score < 4 || score > maxRating)) {
			const bestExtra = await findBestExtraIngredients({
				baseFoodTags: foodPositiveTags,
				baseGameIngredients: relevantIngredients,
				beverageTags,
				execution,
				extraSlots,
				food,
				foodNegativeTags,
				guestOrder,
				hasMystiaCooker,
				ingredientPenaltyContext,
				ingredientPriorityMap,
				isFamousShop,
				maxRating,
				popularTrend,
				recipeId,
				recipeIngredients,
				specialGuest,
				specialGuestBeverageTags,
				specialGuestNegativeTags,
				specialGuestPositiveTags,
			});

			if (
				bestExtra !== null &&
				(bestExtra.score > score || score > maxRating)
			) {
				score = bestExtra.score;
				ingredientPenalty = bestExtra.ingredientPenalty;
				bestMeal = {
					beverage: currentBeverage,
					food: {
						extraIngredients: bestExtra.extraIngredients,
						recipeId,
					},
					price: beveragePrice + foodPrice,
					rating: bestExtra.rating,
				};
			}
		}

		if (score <= maxRating) {
			const totalPrice = bestMeal.price;
			if (totalPrice > budgetMax) {
				continue;
			}
			const priority = getMealPriority(bestMeal, context, {
				fixedExtraIngredients: EMPTY_INGREDIENT_SET,
				isBeverageFixed: true,
				isFoodFixed: false,
			});
			const { acquisitionEase } = priority;

			results.push({
				meal: bestMeal,
				metrics: {
					acquisitionEase,
					extraIngredientPenalty: ingredientPenalty,
					isOverSoftBudget: totalPrice > budgetSoftMax,
					materialCost: getSuggestMealMaterialCost(
						recipeIngredients,
						bestMeal.food.extraIngredients,
						ingredientPenaltyContext
					),
					price: totalPrice,
					priority,
					score,
				},
				score,
			});
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) => `${m.food.recipeId}|${m.food.extraIngredients.join(',')}`,
		{ isBeverageFixed: true, isFoodFixed: false },
		sortProfile,
		execution
	);
}

async function suggestForFood(
	{
		guestOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		sortProfile,
		specialGuest,
	}: ISuggestParams,
	context: TSuggestContext,
	currentFood: IMealFood,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameBeverages,
		baseGameIngredients,
		budgetMax,
		budgetSoftMax,
		foodCatalog,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	} = context;
	const { beverageTag: orderBeverageTag, foodTag: orderFoodTag } = guestOrder;

	const filteredBeverages =
		orderBeverageTag === null
			? baseGameBeverages
			: baseGameBeverages.filter(
					({ tags }) =>
						(tags as ReadonlyArray<TBeverageTagId>).includes(
							orderBeverageTag
						) &&
						(
							specialGuestBeverageTags as ReadonlyArray<TBeverageTagId>
						).includes(orderBeverageTag)
				);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		orderFoodTag
	);

	const { food: foodRecord, recipe } = foodCatalog.getRecipeOwnerById(
		currentFood.recipeId
	);
	const {
		id: food,
		negativeTags: foodNegativeTags,
		positiveTags: foodPositiveTags,
		price: foodPrice,
	} = foodRecord;
	const { ingredients: recipeIngredients } = recipe;

	if (
		recipeIngredients.length + currentFood.extraIngredients.length > 5 ||
		(maxExtraIngredients !== null &&
			currentFood.extraIngredients.length > maxExtraIngredients)
	) {
		return [];
	}

	const results: IScoredResult[] = [];

	const { extraTags: baseExtraTags, isDarkMatter: isBaseDarkMatter } =
		foodCatalog.checkDarkMatter({
			extraIngredients: currentFood.extraIngredients,
			negativeTags: foodNegativeTags,
		});

	const composedFoodTags = foodCatalog.composeFoodTagsWithPopularTrend(
		recipeIngredients,
		currentFood.extraIngredients,
		foodPositiveTags,
		baseExtraTags,
		popularTrend
	);
	const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
		composedFoodTags,
		popularTrend,
		isFamousShop
	);

	const allCurrentIngredients = [
		...recipeIngredients,
		...currentFood.extraIngredients,
	];
	const fixedExtraIngredients = new Set(currentFood.extraIngredients);

	const beverageTagGroups = buildBeverageTagGroups(filteredBeverages);

	const extraSlots =
		maxExtraIngredients === null
			? 5 - allCurrentIngredients.length
			: Math.min(
					5 - allCurrentIngredients.length,
					maxExtraIngredients - currentFood.extraIngredients.length
				);

	for (const {
		members: beverageMembers,
		tags: beverageTags,
	} of beverageTagGroups.values()) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const rating = evaluateSpecialGuestMeal({
			currentBeverageTags: beverageTags,
			currentFoodTagsWithTrend: foodTagsWithTrend,
			currentMealFood: currentFood,
			currentSpecialGuest: specialGuest,
			currentSpecialGuestBeverageTags: specialGuestBeverageTags,
			currentSpecialGuestNegativeTags: specialGuestNegativeTags,
			currentSpecialGuestOrder: guestOrder,
			currentSpecialGuestPositiveTags: specialGuestPositiveTags,
			hasMystiaCooker,
			isDarkMatter: isBaseDarkMatter,
		});

		if (rating === null) {
			continue;
		}

		const baseScore = SCORE_MAP[rating];
		let useExtra = false;
		let finalScore = baseScore;
		let extraIngredients: TIngredientId[] = [];
		let finalRating: TRatingKey = rating;
		let ingredientPenalty = 0;

		if (
			extraSlots > 0 &&
			!isBaseDarkMatter &&
			(baseScore < 4 || baseScore > maxRating)
		) {
			const bestExtra = await findBestExtraIngredients({
				baseFoodTags: composedFoodTags,
				baseGameIngredients: relevantIngredients,
				beverageTags,
				execution,
				extraSlots,
				food,
				foodNegativeTags,
				guestOrder,
				hasMystiaCooker,
				ingredientPenaltyContext,
				ingredientPriorityMap,
				isFamousShop,
				maxRating,
				popularTrend,
				recipeId: currentFood.recipeId,
				recipeIngredients: allCurrentIngredients,
				specialGuest,
				specialGuestBeverageTags,
				specialGuestNegativeTags,
				specialGuestPositiveTags,
			});

			if (
				bestExtra !== null &&
				(bestExtra.score > baseScore || baseScore > maxRating)
			) {
				useExtra = true;
				finalScore = bestExtra.score;
				extraIngredients = bestExtra.extraIngredients;
				finalRating = bestExtra.rating;
				ingredientPenalty = bestExtra.ingredientPenalty;
			}
		}

		if (finalScore <= maxRating) {
			const baseFoodPrice = isBaseDarkMatter
				? DARK_MATTER_META_MAP.price
				: foodPrice;
			const materialExtraIngredients = useExtra
				? [...currentFood.extraIngredients, ...extraIngredients]
				: currentFood.extraIngredients;
			const materialCost = getSuggestMealMaterialCost(
				recipeIngredients,
				materialExtraIngredients,
				ingredientPenaltyContext
			);

			for (const {
				id: beverage,
				price: beveragePrice,
			} of beverageMembers) {
				const bestMeal: ISuggestedMeal = useExtra
					? {
							beverage,
							food: {
								extraIngredients: [
									...currentFood.extraIngredients,
									...extraIngredients,
								],
								recipeId: currentFood.recipeId,
							},
							price: beveragePrice + baseFoodPrice,
							rating: finalRating,
						}
					: {
							beverage,
							food: currentFood,
							price: beveragePrice + baseFoodPrice,
							rating,
						};

				const totalPrice = bestMeal.price;
				if (totalPrice > budgetMax) {
					continue;
				}
				const priority = getMealPriority(bestMeal, context, {
					fixedExtraIngredients,
					isBeverageFixed: false,
					isFoodFixed: true,
				});
				const { acquisitionEase } = priority;

				results.push({
					meal: bestMeal,
					metrics: {
						acquisitionEase,
						extraIngredientPenalty: ingredientPenalty,
						isOverSoftBudget: totalPrice > budgetSoftMax,
						materialCost,
						price: totalPrice,
						priority,
						score: finalScore,
					},
					score: finalScore,
				});
			}
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) =>
			`${m.food.recipeId}|${m.beverage}|${m.food.extraIngredients.join(',')}`,
		{ isBeverageFixed: false, isFoodFixed: true },
		sortProfile,
		execution
	);
}

async function suggestBySelection(
	params: ISuggestParams,
	context: TSuggestContext,
	execution: ISuggestMealsExecution
) {
	const { currentBeverage, currentFood } = params;

	if (currentFood !== null && currentBeverage !== null) {
		return suggestIngredients(
			params,
			context,
			currentFood,
			currentBeverage,
			execution
		);
	}
	if (currentFood !== null) {
		return suggestForFood(params, context, currentFood, execution);
	}
	if (currentBeverage !== null) {
		return suggestForBeverage(params, context, currentBeverage, execution);
	}

	return [];
}

export interface IScoreBasedAlternativesParams {
	baseRating: TRatingKey;
	beverageTags: TBeverageTagId[];
	extraIngredients: TIngredientId[];
	food: TFoodId;
	foodCatalog: FoodCatalog;
	foodNegativeTags: ReadonlyArray<TFoodTagId>;
	foodPositiveTags: ReadonlyArray<TFoodTagId>;
	guestOrder: IGuestOrder;
	hasMystiaCooker: boolean;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	ingredientCatalog: IngredientCatalog;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeId: TRecipeId;
	recipeIngredients: ReadonlyArray<TIngredientId>;
	specialGuest: TSpecialGuestId;
	specialGuestBeverageTags: ReadonlyArray<TBeverageTagId>;
	specialGuestNegativeTags: ReadonlyArray<TFoodTagId>;
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>;
}

export interface IScoreBasedBeverageAlternativesParams extends Omit<
	ISuggestParams,
	'currentBeverage' | 'currentFood' | 'maxExtraIngredients' | 'maxResults'
> {
	readonly baseRating: TRatingKey;
	readonly currentBeverage: TBeverageId;
	readonly currentFood: IMealFood;
}

function getGuestBeverageTagMatchCount(
	beverageTags: ReadonlyArray<TBeverageTagId>,
	specialGuestBeverageTags: ReadonlyArray<TBeverageTagId>
) {
	let matchCount = 0;
	for (const tag of beverageTags) {
		if (specialGuestBeverageTags.includes(tag)) {
			matchCount++;
		}
	}

	return matchCount;
}

export async function getScoreBasedBeverageAlternativesCore(
	{
		baseRating,
		currentBeverage,
		currentFood,
		...suggestParams
	}: IScoreBasedBeverageAlternativesParams,
	execution: ISuggestMealsExecution
) {
	execution.throwIfAborted();

	const beverageCatalog = BeverageCatalog.getInstance();
	const specialGuestBeverageTags =
		SpecialGuestCatalog.getInstance().getPropsById(
			suggestParams.specialGuest,
			'beverageTags'
		);
	const baseGuestTagMatchCount = getGuestBeverageTagMatchCount(
		beverageCatalog.getPropsById(currentBeverage, 'tags'),
		specialGuestBeverageTags
	);
	const hiddenBeverages = new Set(suggestParams.hiddenBeverages);

	for (const beverage of beverageCatalog.data) {
		if (
			getGuestBeverageTagMatchCount(
				beverage.tags,
				specialGuestBeverageTags
			) !== baseGuestTagMatchCount
		) {
			hiddenBeverages.add(beverage.id);
		}
	}

	const currentFoodSnapshot: IMealFood = {
		extraIngredients: [...currentFood.extraIngredients],
		recipeId: currentFood.recipeId,
	};
	const params: ISuggestParams = {
		...suggestParams,
		currentBeverage: null,
		currentFood: currentFoodSnapshot,
		hiddenBeverages,
		maxExtraIngredients: currentFoodSnapshot.extraIngredients.length,
		maxResults: beverageCatalog.data.length,
	};
	const context = getSuggestContext(params);

	if (!checkFixedSelectionsAvailable(params, context)) {
		return [];
	}

	const candidates = await suggestForFood(
		params,
		context,
		currentFoodSnapshot,
		execution
	);

	execution.throwIfAborted();

	return candidates.filter(
		({ beverage, rating }) =>
			beverage !== currentBeverage && rating === baseRating
	);
}

function cloneScoreBasedAlternatives(
	alternatives: ReadonlyMap<TIngredientId, ReadonlyArray<TIngredientId>>
) {
	const cloned = new Map<TIngredientId, TIngredientId[]>();
	for (const [ingredient, candidates] of alternatives) {
		cloned.set(ingredient, [...candidates]);
	}

	return cloned;
}

function getScoreBasedAlternativesLogicalWeight(
	alternatives: ReadonlyMap<TIngredientId, ReadonlyArray<TIngredientId>>
) {
	let weight = 0;
	for (const candidates of alternatives.values()) {
		weight += candidates.length;
	}

	return weight;
}

const SCORE_BASED_ALTERNATIVES_CACHE_MAX_ENTRIES = 4000;
const SCORE_BASED_ALTERNATIVES_CACHE_MAX_ITEMS = 20_000;
const scoreBasedAlternativesCache = createBoundedRuntimeCache<
	string,
	Map<TIngredientId, TIngredientId[]>
>(SCORE_BASED_ALTERNATIVES_CACHE_MAX_ENTRIES, {
	getWeight: getScoreBasedAlternativesLogicalWeight,
	maxWeight: SCORE_BASED_ALTERNATIVES_CACHE_MAX_ITEMS,
});

function buildScoreBasedAlternativesCacheKey({
	baseRating,
	beverageTags,
	extraIngredients,
	food,
	foodNegativeTags,
	foodPositiveTags,
	guestOrder,
	hasMystiaCooker,
	hiddenDlcs,
	hiddenIngredients,
	isFamousShop,
	popularTrend,
	recipeId,
	recipeIngredients,
	specialGuest,
	specialGuestBeverageTags,
	specialGuestNegativeTags,
	specialGuestPositiveTags,
}: IScoreBasedAlternativesParams) {
	return JSON.stringify({
		baseRating,
		beverageTags,
		extraIngredients,
		food,
		foodNegativeTags,
		foodPositiveTags,
		guestOrder,
		hasMystiaCooker,
		hiddenDlcs: [...hiddenDlcs].sort(),
		hiddenIngredients: [...hiddenIngredients].sort(),
		isFamousShop,
		popularTrend,
		recipeId,
		recipeIngredients,
		specialGuest,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	});
}

export async function getScoreBasedAlternativesCore(
	params: IScoreBasedAlternativesParams,
	execution: ISuggestMealsExecution
): Promise<Map<TIngredientId, TIngredientId[]>> {
	const {
		baseRating,
		beverageTags,
		extraIngredients,
		foodCatalog,
		foodNegativeTags,
		foodPositiveTags,
		guestOrder,
		hasMystiaCooker,
		hiddenDlcs,
		hiddenIngredients,
		ingredientCatalog,
		isFamousShop,
		popularTrend,
		recipeId,
		recipeIngredients,
		specialGuest,
		specialGuestBeverageTags,
		specialGuestNegativeTags,
		specialGuestPositiveTags,
	} = params;
	execution.throwIfAborted();
	const canUseCache =
		ingredientCatalog === IngredientCatalog.getInstance() &&
		foodCatalog === FoodCatalog.getInstance();
	const cacheKey = canUseCache
		? buildScoreBasedAlternativesCacheKey(params)
		: null;
	if (cacheKey !== null) {
		const cached = scoreBasedAlternativesCache.get(cacheKey);
		if (cached !== undefined) {
			return cloneScoreBasedAlternatives(cached);
		}
	}
	await execution.checkpoint(true);
	const baseScore = SCORE_MAP[baseRating];
	const result = new Map<TIngredientId, TIngredientId[]>();

	const keepTags = buildRelevantTagSet(
		specialGuestPositiveTags,
		specialGuestNegativeTags,
		guestOrder.foodTag
	);
	const { dlc: specialGuestDlc, maps: specialGuestMaps } =
		SpecialGuestCatalog.getInstance().getPropsById(specialGuest);
	const candidatePriorityMap = new Map<
		TIngredientId,
		IRecommendationPriorityMetrics
	>();

	const filteredCandidates = ingredientCatalog.data.filter((item) => {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			guestDlc: specialGuestDlc,
			guestPlaces: specialGuestMaps,
			hiddenDlcs,
		});
		if (priority !== null) {
			candidatePriorityMap.set(item.id, priority);
		}

		return (
			priority !== null &&
			!ingredientCatalog.blockedIngredients.has(item.id) &&
			!ingredientCatalog.blockedLevels.has(item.level) &&
			!hiddenIngredients.has(item.id) &&
			!item.tags.some((tag) => ingredientCatalog.blockedTags.has(tag)) &&
			item.tags.some((tag) => keepTags.has(tag))
		);
	});
	const ingredientPenaltyContext = createSuggestIngredientPenaltyContext({
		hiddenDlcs,
		hiddenIngredients,
		specialGuest,
	});

	const allExtraTags = extraIngredients.map((ingredient) =>
		ingredientCatalog.getPropsById(ingredient, 'tags')
	);

	const baseTagSets: Array<Set<TFoodTagId>> = extraIngredients.map(
		(_, pos) => {
			const otherTags = allExtraTags
				.filter((_, index) => index !== pos)
				.flat();
			return new Set<TFoodTagId>([...foodPositiveTags, ...otherTags]);
		}
	);

	const totalIngredientCount =
		recipeIngredients.length + extraIngredients.length;
	const evaluateFood = createSpecialGuestMealEvaluator({
		currentBeverageTags: beverageTags,
		currentSpecialGuest: specialGuest,
		currentSpecialGuestBeverageTags: specialGuestBeverageTags,
		currentSpecialGuestNegativeTags: specialGuestNegativeTags,
		currentSpecialGuestOrder: guestOrder,
		currentSpecialGuestPositiveTags: specialGuestPositiveTags,
		hasMystiaCooker,
	});

	for (const [pos, targetIngredient] of extraIngredients.entries()) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const otherExtraIngredients = extraIngredients.filter(
			(_, index) => index !== pos
		);
		const candidates: Array<{
			id: TIngredientId;
			penalty: number;
			priority: IRecommendationPriorityMetrics;
			score: number;
		}> = [];

		for (const item of filteredCandidates) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			if (
				item.id === targetIngredient ||
				otherExtraIngredients.includes(item.id) ||
				recipeIngredients.includes(item.id)
			) {
				continue;
			}

			const replacedExtraIngredients = [
				...otherExtraIngredients,
				item.id,
			];
			const { isDarkMatter } = foodCatalog.checkDarkMatter({
				extraIngredients: replacedExtraIngredients,
				negativeTags: foodNegativeTags,
			});
			if (isDarkMatter) {
				continue;
			}

			const tagSet = new Set(baseTagSets[pos]);
			for (const tag of item.tags) {
				tagSet.add(tag);
			}
			FoodCatalog.applyLargePartition(
				tagSet,
				totalIngredientCount,
				popularTrend
			);
			FoodCatalog.applyTagCovers(tagSet, popularTrend);

			const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
				[...tagSet],
				popularTrend,
				isFamousShop
			);

			const rating = evaluateFood({
				currentFoodTagsWithTrend: foodTagsWithTrend,
				currentMealFood: {
					extraIngredients: replacedExtraIngredients,
					recipeId,
				},
				isDarkMatter,
			});

			if (rating !== null && SCORE_MAP[rating] >= baseScore) {
				const priority = candidatePriorityMap.get(item.id);
				if (priority === undefined) {
					throw new Error(
						`替代食材 ID “${item.id}”缺少已选择的可获取路径`
					);
				}
				candidates.push({
					id: item.id,
					penalty: getSuggestIngredientResourcePenalty(
						item.id,
						ingredientPenaltyContext
					).total,
					priority,
					score: SCORE_MAP[rating],
				});
			}
		}

		candidates.sort(
			(a, b) =>
				b.score - a.score ||
				compareRecommendationStrictMetrics(a.priority, b.priority) ||
				a.penalty - b.penalty
		);
		result.set(
			targetIngredient,
			candidates.map((candidate) => candidate.id)
		);
	}

	execution.throwIfAborted();
	if (cacheKey !== null) {
		scoreBasedAlternativesCache.set(
			cacheKey,
			cloneScoreBasedAlternatives(result)
		);
	}
	return result;
}

export interface IRecommendationCoreMemoryCacheStats {
	readonly alternatives: IBoundedRuntimeCacheStats;
	readonly exactIngredientState: IBoundedRuntimeCacheStats;
	readonly recipeIngredientSummary: IBoundedRuntimeCacheStats;
	readonly searchContext: IBoundedRuntimeCacheStats;
}

export function getRecommendationCoreMemoryCacheStats(): IRecommendationCoreMemoryCacheStats {
	return {
		alternatives: scoreBasedAlternativesCache.getStats(),
		exactIngredientState: exactIngredientStateCache.getStats(),
		recipeIngredientSummary: recipeIngredientSummaryCache.getStats(),
		searchContext: suggestContextCache.getStats(),
	};
}

export interface ISuggestMealsCoreSession {
	suggest(
		params: ISuggestParams,
		execution: ISuggestMealsExecution
	): Promise<ReadonlyArray<ISuggestedMeal>>;
}

export function createSuggestMealsCoreSession(): ISuggestMealsCoreSession {
	const automaticBatchState = createAutomaticSuggestBatchState();

	return {
		async suggest(params, execution) {
			const { currentBeverage, currentFood } = params;
			const context = getSuggestContext(params);

			return checkFixedSelectionsAvailable(params, context)
				? currentBeverage !== null || currentFood !== null
					? suggestBySelection(params, context, execution)
					: computeSuggestions(
							params,
							context,
							execution,
							automaticBatchState
						)
				: [];
		},
	};
}
