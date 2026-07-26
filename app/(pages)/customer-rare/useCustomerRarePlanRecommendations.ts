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
import {
	readCustomerRarePlanResult,
	writeCustomerRarePlanResult,
} from '@/lib/recommendations/persistentCache';
import { RECOMMENDATION_CACHE_READ_GRACE_MS } from '@/lib/recommendations/persistentCache/constants';
import { recordRecommendationCacheResolution } from '@/lib/recommendations/persistentCache/debug';
import { resolvePersistentRecommendationRace } from '@/lib/recommendations/persistentCache/race';
import type { IPopularTrend } from '@/types';
import {
	checkSuggestMealsAbortError,
	createRoundRobinSuggestMealsScheduler,
} from '@/utils/customer/customer_rare/suggestMealsEngine';
import {
	createRecommendedCustomerRarePlanMealSession,
	resolveRecommendedCustomerRarePlanMealBatch,
} from '@/utils/customer/shared';

import {
	buildCustomerRarePlanRecommendationCacheKey,
	peekCustomerRarePlanRecommendationCache,
	readCustomerRarePlanRecommendationCache,
	writeCustomerRarePlanRecommendationCache,
} from './customerRarePlanRecommendationCache';

const RECOMMENDED_MEAL_BATCH_SIZE = 1;
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
			buildCustomerRarePlanRecommendationCacheKey({
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
		() => peekCustomerRarePlanRecommendationCache(cacheKey),
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
		const cachedMeals = readCustomerRarePlanRecommendationCache(cacheKey);
		if (cachedMeals !== undefined) {
			recordRecommendationCacheResolution('customerRarePlan', 'memory');
		}
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
				const { result: completedMeals, source } =
					await resolvePersistentRecommendationRace({
						compute: async (signal) => {
							let isComplete = false;
							let nextIndex = initialNextIndex;
							while (!isComplete) {
								await sharedRecommendationScheduler.yield(
									taskKey,
									signal
								);
								const batch =
									await resolveRecommendedCustomerRarePlanMealBatch(
										{
											batchSize:
												RECOMMENDED_MEAL_BATCH_SIZE,
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
											scheduler:
												sharedRecommendationScheduler,
											signal,
											taskKey,
										}
									);

								if (
									signal.aborted ||
									generationRef.current !== generation
								) {
									throw new DOMException(
										'The operation was aborted.',
										'AbortError'
									);
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
							return mealsRef.current;
						},
						graceMs: RECOMMENDATION_CACHE_READ_GRACE_MS,
						readPersistent: () =>
							readCustomerRarePlanResult(cacheKey),
						signal: controller.signal,
					});

				if (
					controller.signal.aborted ||
					generationRef.current !== generation
				) {
					return;
				}
				recordRecommendationCacheResolution('customerRarePlan', source);
				mealsRef.current = completedMeals;
				isCompleteRef.current = true;
				writeCustomerRarePlanRecommendationCache(cacheKey, {
					isComplete: true,
					meals: completedMeals,
				});
				setMeals(completedMeals);
				setStatus('complete');
				if (source === 'compute') {
					void writeCustomerRarePlanResult(cacheKey, completedMeals);
				}
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
