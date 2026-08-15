'use client';

import type { ISuggestedMeal } from '@/domain/recommendations/types';

import {
	SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES,
	SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS,
	SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} from './constants';
import {
	readRecommendationCacheResult,
	writeRecommendationCacheResult,
} from './database';
import { refreshRecommendationCacheDebugSnapshot } from './debug';
import {
	type ICachedSpecialGuestPlanRecommendationMeal,
	validateSpecialGuestPlanResult,
	validateSuggestedMealResult,
} from './validation';

type TSpecialGuestPlanRecommendationCacheResult =
	ICachedSpecialGuestPlanRecommendationMeal[];

const suggestedMealCardLimits = {
	maxEntries: SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	maxLogicalWeight: SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} as const;
const specialGuestPlanLimits = {
	maxEntries: SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES,
	maxLogicalWeight: SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS,
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

export function readSpecialGuestPlanResult(requestKey: string) {
	return readRecommendationCacheResult(
		'specialGuestPlanResults',
		requestKey,
		validateSpecialGuestPlanResult,
		(result) => Math.max(1, result.length)
	);
}

export function writeSpecialGuestPlanResult(
	requestKey: string,
	result: TSpecialGuestPlanRecommendationCacheResult
) {
	const validated = validateSpecialGuestPlanResult(result);
	if (validated === undefined) {
		return Promise.resolve(false);
	}
	return writeRecommendationCacheResult(
		'specialGuestPlanResults',
		requestKey,
		validated,
		Math.max(1, validated.length),
		specialGuestPlanLimits
	).then((isWritten) => {
		void refreshRecommendationCacheDebugSnapshot();
		return isWritten;
	});
}
