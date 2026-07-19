'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
	type TBeverageName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TRecipeName,
} from '@/data';
import { getLogSafeErrorCode } from '@/lib/logging';
import type { IPopularTrend, IResolvedCustomerRarePlanGroup } from '@/types';
import { createBoundedRuntimeCache, pinyinSort } from '@/utilities';
import {
	checkSuggestMealsAbortError,
	createRoundRobinSuggestMealsScheduler,
} from '@/utils/customer/customer_rare/suggestMealsEngine';
import {
	createRecommendedCustomerRarePlanMealSession,
	resolveRecommendedCustomerRarePlanMealBatch,
} from '@/utils/customer/shared';

const RECOMMENDED_MEAL_BATCH_SIZE = 1;
const RECOMMENDED_MEAL_CACHE_MAX_SIZE = 256;
const RECOMMENDED_MEAL_CACHE_MAX_WEIGHT = 4096;
const sharedRecommendationScheduler = createRoundRobinSuggestMealsScheduler();

interface IUseCustomerRarePlanRecommendationsParams {
	readonly customerName: TCustomerRareName;
	readonly hiddenBeverages: ReadonlySet<TBeverageName>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenIngredients: ReadonlySet<TIngredientName>;
	readonly hiddenRecipes: ReadonlySet<TRecipeName>;
	readonly isEnabled: boolean;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
	readonly sessionKey: string;
}

export type TCustomerRarePlanRecommendationStatus =
	| 'complete'
	| 'error'
	| 'idle'
	| 'partial'
	| 'pending';

const recommendedMealCache = createBoundedRuntimeCache<
	string,
	IResolvedCustomerRarePlanGroup['meals']
>(RECOMMENDED_MEAL_CACHE_MAX_SIZE, {
	getWeight: (meals) => Math.max(1, meals.length),
	maxWeight: RECOMMENDED_MEAL_CACHE_MAX_WEIGHT,
});

function getSortedCacheValues<T extends number | string>(
	values: ReadonlySet<T>
) {
	return [...values].map(String).sort(pinyinSort);
}

function buildCacheKey({
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
}: Omit<
	IUseCustomerRarePlanRecommendationsParams,
	'isEnabled' | 'sessionKey'
>) {
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

export function useCustomerRarePlanRecommendations({
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isEnabled,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
	sessionKey,
}: IUseCustomerRarePlanRecommendationsParams) {
	const cacheKey = useMemo(
		() =>
			buildCacheKey({
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
			}),
		[
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
		]
	);
	const cacheSnapshot = useMemo(
		() => recommendedMealCache.peek(cacheKey),
		[cacheKey]
	);
	const recommendationSession = useMemo(
		() =>
			createRecommendedCustomerRarePlanMealSession({
				customerName,
				hiddenDlcs,
			}),
		[customerName, hiddenDlcs]
	);
	const generationRef = useRef(0);
	const isCompleteRef = useRef(cacheSnapshot !== undefined);
	const mealsRef = useRef(cacheSnapshot ?? []);
	const nextIndexRef = useRef(0);
	const [publishedCacheKey, setPublishedCacheKey] = useState(cacheKey);
	const [meals, setMeals] = useState(cacheSnapshot ?? []);
	const [status, setStatus] = useState<TCustomerRarePlanRecommendationStatus>(
		cacheSnapshot === undefined ? 'idle' : 'complete'
	);

	useLayoutEffect(() => {
		const cachedMeals = recommendedMealCache.get(cacheKey);
		generationRef.current++;
		isCompleteRef.current = cachedMeals !== undefined;
		mealsRef.current = cachedMeals ?? [];
		nextIndexRef.current = 0;
		setPublishedCacheKey(cacheKey);
		setMeals(cachedMeals ?? []);
		setStatus(cachedMeals === undefined ? 'idle' : 'complete');
	}, [cacheKey]);

	useLayoutEffect(() => {
		const generation = ++generationRef.current;
		if (!isEnabled || isCompleteRef.current) {
			return;
		}

		const controller = new AbortController();
		const taskKey = `customer-plan:${sessionKey}:${cacheKey}`;
		const initialNextIndex = nextIndexRef.current;
		setStatus(mealsRef.current.length === 0 ? 'pending' : 'partial');

		const run = async () => {
			try {
				let isComplete = false;
				let nextIndex = initialNextIndex;
				while (!isComplete) {
					await sharedRecommendationScheduler.yield(
						taskKey,
						controller.signal
					);
					const batch =
						await resolveRecommendedCustomerRarePlanMealBatch(
							{
								batchSize: RECOMMENDED_MEAL_BATCH_SIZE,
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
								session: recommendationSession,
								startIndex: nextIndex,
							},
							{
								scheduler: sharedRecommendationScheduler,
								signal: controller.signal,
								taskKey,
							}
						);

					if (
						controller.signal.aborted ||
						generationRef.current !== generation
					) {
						return;
					}

					nextIndex = batch.nextIndex;
					nextIndexRef.current = nextIndex;
					if (batch.meals.length > 0) {
						mealsRef.current = [
							...mealsRef.current,
							...batch.meals,
						];
						setMeals(mealsRef.current);
					}
					isComplete = batch.isComplete;
					if (!isComplete) {
						setStatus('partial');
					}
				}

				isCompleteRef.current = true;
				recommendedMealCache.set(cacheKey, mealsRef.current);
				setStatus('complete');
			} catch (error) {
				if (
					controller.signal.aborted ||
					checkSuggestMealsAbortError(error) ||
					generationRef.current !== generation
				) {
					return;
				}

				console.warn('Customer plan recommendation failed.', {
					errorCode: getLogSafeErrorCode(error),
				});
				setStatus('error');
			}
		};

		void run();

		return () => {
			controller.abort();
		};
	}, [
		cacheKey,
		customerName,
		hiddenBeverages,
		hiddenDlcs,
		hiddenIngredients,
		hiddenRecipes,
		isEnabled,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		recommendationSession,
		sessionKey,
	]);

	const isPublishedStateCurrent = publishedCacheKey === cacheKey;
	const visibleMeals = isPublishedStateCurrent
		? meals
		: (cacheSnapshot ?? []);
	const visibleStatus = isPublishedStateCurrent
		? status
		: cacheSnapshot === undefined
			? 'idle'
			: 'complete';
	const effectiveStatus =
		isEnabled && visibleStatus === 'idle' ? 'pending' : visibleStatus;

	return { meals: visibleMeals, status: effectiveStatus };
}
