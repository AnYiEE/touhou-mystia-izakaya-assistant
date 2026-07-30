'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { RECOMMENDATION_CACHE_READ_GRACE_MS } from '@/features/recommendations/client/cache/constants';
import { recordRecommendationCacheResolution } from '@/features/recommendations/client/cache/debug';
import { resolvePersistentRecommendationRace } from '@/features/recommendations/client/cache/race';
import {
	readCustomerRarePlanResult,
	writeCustomerRarePlanResult,
} from '@/features/recommendations/client/cache/results';
import {
	checkSuggestMealsAbortError,
	createRoundRobinSuggestMealsScheduler,
} from '@/features/recommendations/client/scheduler';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	buildCustomerRarePlanRecommendationCacheKey,
	peekCustomerRarePlanRecommendationCache,
	readCustomerRarePlanRecommendationCache,
	writeCustomerRarePlanRecommendationCache,
} from './cache/customerRarePlanRecommendationCache';
import {
	createRecommendedCustomerRarePlanMealSession,
	resolveRecommendedCustomerRarePlanMealBatch,
} from './recommendations/resolveRecommendedCustomerRarePlanMeals';

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
							const remainingComboCount =
								recommendationSession.combos.length -
								initialNextIndex;
							if (remainingComboCount <= 0) {
								return mealsRef.current;
							}
							await resolveRecommendedCustomerRarePlanMealBatch(
								{
									batchSize: remainingComboCount,
									customerName,
									hiddenBeverages,
									hiddenDlcs,
									hiddenIngredients,
									hiddenRecipes,
									isFamousShop,
									maxExtraIngredients,
									maxRating,
									maxResults,
									onProgress: ({
										isComplete,
										meals: nextMeals,
										nextIndex,
									}) => {
										if (
											signal.aborted ||
											generationRef.current !== generation
										) {
											throw new DOMException(
												'The operation was aborted.',
												'AbortError'
											);
										}

										nextIndexRef.current = nextIndex;
										if (nextMeals.length > 0) {
											mealsRef.current = [
												...mealsRef.current,
												...nextMeals,
											];
											setMeals(mealsRef.current);
										}
										if (!isComplete) {
											setStatus('partial');
										}
									},
									popularTrend,
									session: recommendationSession,
									startIndex: initialNextIndex,
								},
								{
									scheduler: sharedRecommendationScheduler,
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
