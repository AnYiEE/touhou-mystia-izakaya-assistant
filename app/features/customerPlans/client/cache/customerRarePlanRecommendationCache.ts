import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { IResolvedCustomerRarePlanGroup } from '@/features/customerPlans/contracts';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';

const CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES = 200;
const CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS = 200_000;

type TCustomerRarePlanMeals = IResolvedCustomerRarePlanGroup['meals'];

export interface ICustomerRarePlanRecommendationCacheKeyParams {
	readonly customerName: TCustomerRareName;
	readonly hiddenBeverages: ReadonlySet<TBeverageName>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenIngredients: ReadonlySet<TIngredientName>;
	readonly hiddenRecipes: ReadonlySet<TRecipeName>;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
}

interface ICustomerRarePlanRecommendationCacheResult {
	readonly isComplete: boolean;
	readonly meals: TCustomerRarePlanMeals;
}

const customerRarePlanRecommendationCache = createBoundedRuntimeCache<
	string,
	TCustomerRarePlanMeals
>(CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES, {
	getWeight: (meals) => Math.max(1, meals.length),
	maxWeight: CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS,
});

function getSortedCacheValues<T extends number | string>(
	values: ReadonlySet<T>
) {
	return [...values].map(String).sort();
}

export function buildCustomerRarePlanRecommendationCacheKey({
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
}: ICustomerRarePlanRecommendationCacheKeyParams) {
	return JSON.stringify({
		customerName,
		hiddenBeverages: getSortedCacheValues(hiddenBeverages),
		hiddenDlcs: getSortedCacheValues(hiddenDlcs),
		hiddenIngredients: getSortedCacheValues(hiddenIngredients),
		hiddenRecipes: getSortedCacheValues(hiddenRecipes),
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
	});
}

export function getCustomerRarePlanRecommendationCacheStats() {
	return customerRarePlanRecommendationCache.getStats();
}

export function peekCustomerRarePlanRecommendationCache(cacheKey: string) {
	const meals = customerRarePlanRecommendationCache.peek(cacheKey);
	return meals === undefined ? undefined : [...meals];
}

export function readCustomerRarePlanRecommendationCache(cacheKey: string) {
	const meals = customerRarePlanRecommendationCache.get(cacheKey);
	return meals === undefined ? undefined : [...meals];
}

export function writeCustomerRarePlanRecommendationCache(
	cacheKey: string,
	{ isComplete, meals }: ICustomerRarePlanRecommendationCacheResult
) {
	if (!isComplete) {
		return;
	}

	customerRarePlanRecommendationCache.set(cacheKey, [...meals]);
}
