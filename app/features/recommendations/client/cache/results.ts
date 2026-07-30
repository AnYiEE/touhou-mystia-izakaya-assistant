'use client';

import type { ISuggestedMeal } from '@/domain/recommendations/types';

import type { IResolvedCustomerRarePlanGroup } from '@/features/customerPlans/contracts';

import {
	CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES,
	CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS,
	SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} from './constants';
import {
	readRecommendationCacheResult,
	writeRecommendationCacheResult,
} from './database';
import { refreshRecommendationCacheDebugSnapshot } from './debug';
import {
	validateCustomerRarePlanResult,
	validateSuggestedMealResult,
} from './validation';

type TCustomerRarePlanMeals = IResolvedCustomerRarePlanGroup['meals'];

const suggestedMealCardLimits = {
	maxEntries: SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	maxLogicalWeight: SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} as const;
const customerRarePlanLimits = {
	maxEntries: CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES,
	maxLogicalWeight: CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS,
} as const;

export function readSuggestedMealCardResult(requestKey: string) {
	return readRecommendationCacheResult(
		'suggestedMealCardResults',
		requestKey,
		validateSuggestedMealResult,
		(result) => Math.max(1, result.length)
	);
}

export function writeSuggestedMealCardResult(
	requestKey: string,
	result: ReadonlyArray<ISuggestedMeal>
) {
	const validated = validateSuggestedMealResult(result);
	if (validated === undefined) {
		return Promise.resolve(false);
	}
	return writeRecommendationCacheResult(
		'suggestedMealCardResults',
		requestKey,
		validated,
		Math.max(1, validated.length),
		suggestedMealCardLimits
	).then((isWritten) => {
		void refreshRecommendationCacheDebugSnapshot();
		return isWritten;
	});
}

export function readCustomerRarePlanResult(requestKey: string) {
	return readRecommendationCacheResult(
		'customerRarePlanResults',
		requestKey,
		validateCustomerRarePlanResult,
		(result) => Math.max(1, result.length)
	);
}

export function writeCustomerRarePlanResult(
	requestKey: string,
	result: TCustomerRarePlanMeals
) {
	const validated = validateCustomerRarePlanResult(result);
	if (validated === undefined) {
		return Promise.resolve(false);
	}
	return writeRecommendationCacheResult(
		'customerRarePlanResults',
		requestKey,
		validated,
		Math.max(1, validated.length),
		customerRarePlanLimits
	).then((isWritten) => {
		void refreshRecommendationCacheDebugSnapshot();
		return isWritten;
	});
}
