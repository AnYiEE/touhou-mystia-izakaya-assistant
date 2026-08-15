'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { RECOMMENDATION_CACHE_READ_GRACE_MS } from '@/features/recommendations/client/cache/constants';
import { recordRecommendationCacheResolution } from '@/features/recommendations/client/cache/debug';
import { resolvePersistentRecommendationRace } from '@/features/recommendations/client/cache/race';
import {
	readSpecialGuestPlanResult,
	writeSpecialGuestPlanResult,
} from '@/features/recommendations/client/cache/results';
import { type ICachedSpecialGuestPlanRecommendationMeal } from '@/features/recommendations/client/cache/validation';
import {
	checkSuggestMealsAbortError,
	createRoundRobinSuggestMealsScheduler,
} from '@/features/recommendations/client/scheduler';
import type { IResolvedSpecialGuestPlanMeal } from '@/features/specialGuestPlans/contracts';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	buildSpecialGuestPlanRecommendationCacheKey,
	peekSpecialGuestPlanRecommendationCache,
	readSpecialGuestPlanRecommendationCache,
	writeSpecialGuestPlanRecommendationCache,
} from './cache/specialGuestPlanRecommendationCache';
import {
	createRecommendedSpecialGuestPlanMealSession,
	resolveRecommendedSpecialGuestPlanMealBatch,
} from './recommendations/resolveRecommendedSpecialGuestPlanMeals';

const sharedRecommendationScheduler = createRoundRobinSuggestMealsScheduler();

function toCachedMeal(
	meal: IResolvedSpecialGuestPlanMeal
): ICachedSpecialGuestPlanRecommendationMeal {
	if (meal.source !== 'recommended') {
		throw new TypeError('invalid-special-guest-plan-cache-source');
	}

	return { ...meal, source: 'recommended' };
}

interface IUseSpecialGuestPlanRecommendationsParams {
	readonly hiddenBeverages: ReadonlySet<TBeverageId>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenFoods: ReadonlySet<TFoodId>;
	readonly hiddenIngredients: ReadonlySet<TIngredientId>;
	readonly isEnabled: boolean;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
	readonly sessionKey: string;
	readonly specialGuest: TSpecialGuestId;
}

export type TSpecialGuestPlanRecommendationStatus =
	| 'complete'
	| 'error'
	| 'idle'
	| 'partial'
	| 'pending';

export function useSpecialGuestPlanRecommendations({
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	isEnabled,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
	sessionKey,
	specialGuest,
}: IUseSpecialGuestPlanRecommendationsParams) {
	const cacheKey = useMemo(
		() =>
			buildSpecialGuestPlanRecommendationCacheKey({
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
			}),
		[
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
		]
	);
	const cacheSnapshot = useMemo(
		() => peekSpecialGuestPlanRecommendationCache(cacheKey),
		[cacheKey]
	);
	const recommendationSession = useMemo(
		() =>
			createRecommendedSpecialGuestPlanMealSession({
				hiddenDlcs,
				specialGuest,
			}),
		[hiddenDlcs, specialGuest]
	);
	const generationRef = useRef(0);
	const isCompleteRef = useRef(cacheSnapshot !== undefined);
	const mealsRef = useRef(cacheSnapshot ?? []);
	const nextIndexRef = useRef(0);
	const [publishedCacheKey, setPublishedCacheKey] = useState(cacheKey);
	const [meals, setMeals] = useState(cacheSnapshot ?? []);
	const [status, setStatus] = useState<TSpecialGuestPlanRecommendationStatus>(
		cacheSnapshot === undefined ? 'idle' : 'complete'
	);

	useLayoutEffect(() => {
		const cachedMeals = readSpecialGuestPlanRecommendationCache(cacheKey);
		if (cachedMeals !== undefined) {
			recordRecommendationCacheResolution('specialGuestPlan', 'memory');
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
		const taskKey = `special-guest-plan:${sessionKey}:${cacheKey}`;
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
							await resolveRecommendedSpecialGuestPlanMealBatch(
								{
									batchSize: remainingComboCount,
									hiddenBeverages,
									hiddenDlcs,
									hiddenFoods,
									hiddenIngredients,
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
									specialGuest,
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
							readSpecialGuestPlanResult(cacheKey),
						signal: controller.signal,
					});

				if (
					controller.signal.aborted ||
					generationRef.current !== generation
				) {
					return;
				}
				recordRecommendationCacheResolution('specialGuestPlan', source);
				mealsRef.current = completedMeals;
				isCompleteRef.current = true;
				writeSpecialGuestPlanRecommendationCache(cacheKey, {
					isComplete: true,
					meals: completedMeals,
				});
				setMeals(completedMeals);
				setStatus('complete');
				if (source === 'compute') {
					void writeSpecialGuestPlanResult(
						cacheKey,
						completedMeals.map(toCachedMeal)
					);
				}
			} catch (error) {
				if (
					controller.signal.aborted ||
					checkSuggestMealsAbortError(error) ||
					generationRef.current !== generation
				) {
					return;
				}

				console.warn('Special guest plan recommendation failed.', {
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
		hiddenBeverages,
		hiddenDlcs,
		hiddenFoods,
		hiddenIngredients,
		isEnabled,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
		recommendationSession,
		sessionKey,
		specialGuest,
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
