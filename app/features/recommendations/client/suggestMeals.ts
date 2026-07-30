import type { TIngredientName } from '@/domain/data/ingredients/types';
import type {
	ISuggestMealsExecution,
	ISuggestMealsYieldScheduler,
} from '@/domain/recommendations/execution';
import {
	type IRecommendationCoreMemoryCacheStats,
	type IScoreBasedAlternativesParams,
	type ISuggestMealsCoreSession,
	createSuggestMealsCoreSession,
	getRecommendationCoreMemoryCacheStats,
	getScoreBasedAlternativesCore,
} from '@/domain/recommendations/suggestMeals';
import type {
	ISuggestParams,
	ISuggestedMeal,
} from '@/domain/recommendations/types';

import {
	type IBoundedRuntimeCacheStats,
	createBoundedRuntimeCache,
} from '@/shared/utilities/cache/createBoundedRuntimeCache';

import { createSuggestMealsExecution } from './scheduler';

export function buildSuggestMealsCacheKey({
	cooker,
	currentBeverage,
	currentRecipe,
	customerName,
	customerOrder,
	hasMystiaCooker,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
}: ISuggestParams) {
	return [
		cooker ?? '',
		currentBeverage ?? '',
		currentRecipe
			? `${currentRecipe.name}:${currentRecipe.extraIngredients.join(',')}`
			: '',
		customerName,
		customerOrder.beverageTag ?? '',
		customerOrder.recipeTag ?? '',
		hasMystiaCooker ? '1' : '0',
		[...hiddenBeverages].sort().join(','),
		[...hiddenDlcs].sort().join(','),
		[...hiddenIngredients].sort().join(','),
		[...hiddenRecipes].sort().join(','),
		isFamousShop ? '1' : '0',
		maxExtraIngredients?.toString() ?? '',
		maxResults.toString(),
		maxRating.toString(),
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
	].join('|');
}

export async function getScoreBasedAlternatives(
	params: IScoreBasedAlternativesParams,
	options: ISuggestMealsOptions = {}
): Promise<Map<TIngredientName, TIngredientName[]>> {
	return getScoreBasedAlternativesCore(
		params,
		createSuggestMealsExecution(options)
	);
}

const SUGGEST_CACHE_MAX_ENTRIES = 15_000;
const SUGGEST_CACHE_MAX_MEALS = 150_000;
const suggestCache = createBoundedRuntimeCache<string, ISuggestedMeal[]>(
	SUGGEST_CACHE_MAX_ENTRIES,
	{
		getWeight: (meals) => Math.max(1, meals.length),
		maxWeight: SUGGEST_CACHE_MAX_MEALS,
	}
);

export interface IRecommendationMemoryCacheStats extends IRecommendationCoreMemoryCacheStats {
	readonly finalResult: IBoundedRuntimeCacheStats;
}

export function getRecommendationMemoryCacheStats(): IRecommendationMemoryCacheStats {
	return {
		...getRecommendationCoreMemoryCacheStats(),
		finalResult: suggestCache.getStats(),
	};
}

function cloneSuggestedMeals(meals: ReadonlyArray<ISuggestedMeal>) {
	return meals.map(({ beverage, price, rating, recipe }) => ({
		beverage,
		price,
		rating,
		recipe: {
			extraIngredients: [...recipe.extraIngredients],
			name: recipe.name,
		},
	}));
}

function createSuggestParamsSnapshot(params: ISuggestParams): ISuggestParams {
	return {
		...params,
		currentRecipe:
			params.currentRecipe === null
				? null
				: {
						extraIngredients: [
							...params.currentRecipe.extraIngredients,
						],
						name: params.currentRecipe.name,
					},
		customerOrder: { ...params.customerOrder },
		hiddenBeverages: new Set(params.hiddenBeverages),
		hiddenDlcs: new Set(params.hiddenDlcs),
		hiddenIngredients: new Set(params.hiddenIngredients),
		hiddenRecipes: new Set(params.hiddenRecipes),
		popularTrend: { ...params.popularTrend },
	};
}

export function readSuggestedMealsMemoryCache(params: ISuggestParams) {
	const paramsSnapshot = createSuggestParamsSnapshot(params);
	const cached = suggestCache.get(buildSuggestMealsCacheKey(paramsSnapshot));
	return cached === undefined ? undefined : cloneSuggestedMeals(cached);
}

export interface ISuggestMealsOptions {
	readonly scheduler?: ISuggestMealsYieldScheduler;
	readonly signal?: AbortSignal;
	readonly sliceBudgetMs?: number;
	readonly taskKey?: string;
}

export interface ISuggestMealsBatchResult {
	readonly index: number;
	readonly meals: ReadonlyArray<ISuggestedMeal>;
}

export interface ISuggestMealsBatchOptions extends ISuggestMealsOptions {
	readonly onResult?: (result: ISuggestMealsBatchResult) => void;
}

async function suggestMealsWithExecution(
	paramsSnapshot: ISuggestParams,
	execution: ISuggestMealsExecution,
	coreSession: ISuggestMealsCoreSession
) {
	execution.throwIfAborted();
	const cacheKey = buildSuggestMealsCacheKey(paramsSnapshot);

	const cached = suggestCache.get(cacheKey);
	if (cached !== undefined) {
		return cloneSuggestedMeals(cached);
	}

	await execution.checkpoint(true);
	const result = await coreSession.suggest(paramsSnapshot, execution);

	execution.throwIfAborted();
	const cachedResult = cloneSuggestedMeals(result);
	suggestCache.set(cacheKey, cachedResult);

	return cloneSuggestedMeals(cachedResult);
}

export async function suggestMeals(
	params: ISuggestParams,
	options: ISuggestMealsOptions = {}
) {
	return suggestMealsWithExecution(
		createSuggestParamsSnapshot(params),
		createSuggestMealsExecution(options),
		createSuggestMealsCoreSession()
	);
}

export async function suggestMealsBatch(
	requests: ReadonlyArray<ISuggestParams>,
	options: ISuggestMealsBatchOptions = {}
) {
	const { onResult, ...suggestMealsOptions } = options;
	const requestSnapshots = requests.map(createSuggestParamsSnapshot);
	const execution = createSuggestMealsExecution(suggestMealsOptions);
	const coreSession = createSuggestMealsCoreSession();
	const results: ISuggestedMeal[][] = [];

	for (const [index, request] of requestSnapshots.entries()) {
		const meals = await suggestMealsWithExecution(
			request,
			execution,
			coreSession
		);
		results.push(meals);
		onResult?.({ index, meals: cloneSuggestedMeals(meals) });
	}

	return results;
}
