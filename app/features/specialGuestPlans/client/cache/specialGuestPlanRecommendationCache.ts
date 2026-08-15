import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { IResolvedSpecialGuestPlanGroup } from '@/features/specialGuestPlans/contracts';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';

const SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES = 200;
const SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS = 200_000;

type TSpecialGuestPlanMeals = IResolvedSpecialGuestPlanGroup['meals'];

export interface ISpecialGuestPlanRecommendationCacheKeyParams {
	readonly hiddenBeverages: ReadonlySet<TBeverageId>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenFoods: ReadonlySet<TFoodId>;
	readonly hiddenIngredients: ReadonlySet<TIngredientId>;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
	readonly specialGuest: TSpecialGuestId;
}

interface ISpecialGuestPlanRecommendationCacheResult {
	readonly isComplete: boolean;
	readonly meals: TSpecialGuestPlanMeals;
}

const specialGuestPlanRecommendationCache = createBoundedRuntimeCache<
	string,
	TSpecialGuestPlanMeals
>(SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES, {
	getWeight: (meals) => Math.max(1, meals.length),
	maxWeight: SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS,
});

function getSortedCacheValues<T extends number | string>(
	values: ReadonlySet<T>
) {
	return [...values].map(String).sort();
}

export function buildSpecialGuestPlanRecommendationCacheKey({
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
	specialGuest,
}: ISpecialGuestPlanRecommendationCacheKeyParams) {
	return JSON.stringify({
		hiddenBeverages: getSortedCacheValues(hiddenBeverages),
		hiddenDlcs: getSortedCacheValues(hiddenDlcs),
		hiddenFoods: getSortedCacheValues(hiddenFoods),
		hiddenIngredients: getSortedCacheValues(hiddenIngredients),
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		specialGuest,
	});
}

export function getSpecialGuestPlanRecommendationCacheStats() {
	return specialGuestPlanRecommendationCache.getStats();
}

export function peekSpecialGuestPlanRecommendationCache(cacheKey: string) {
	const meals = specialGuestPlanRecommendationCache.peek(cacheKey);
	return meals === undefined ? undefined : [...meals];
}

export function readSpecialGuestPlanRecommendationCache(cacheKey: string) {
	const meals = specialGuestPlanRecommendationCache.get(cacheKey);
	return meals === undefined ? undefined : [...meals];
}

export function writeSpecialGuestPlanRecommendationCache(
	cacheKey: string,
	{ isComplete, meals }: ISpecialGuestPlanRecommendationCacheResult
) {
	if (!isComplete) {
		return;
	}

	specialGuestPlanRecommendationCache.set(cacheKey, [...meals]);
}
