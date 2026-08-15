'use client';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import {
	RECOMMENDATION_ALGORITHM_VERSION,
	RECOMMENDATION_CACHE_DATABASE_VERSION,
	RECOMMENDATION_CACHE_EPOCH,
	RECOMMENDATION_CACHE_RECORD_VERSION,
	SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES,
	SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS,
	SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} from './constants';
import { getRecommendationCacheContext } from './context';
import { getRecommendationCacheStoreStats } from './database';

type TRecommendationCacheConsumer = 'specialGuestPlan' | 'suggestedMealCard';
type TRecommendationCacheResolutionSource = 'compute' | 'memory' | 'persistent';

interface IRecommendationCacheDebugConsumerState {
	compute: number;
	latestSource: TRecommendationCacheResolutionSource | null;
	memory: number;
	persistent: number;
}

interface IRecommendationCacheDebugState {
	specialGuestPlan: IRecommendationCacheDebugConsumerState;
	suggestedMealCard: IRecommendationCacheDebugConsumerState;
}

const debugState: IRecommendationCacheDebugState = {
	specialGuestPlan: {
		compute: 0,
		latestSource: null,
		memory: 0,
		persistent: 0,
	},
	suggestedMealCard: {
		compute: 0,
		latestSource: null,
		memory: 0,
		persistent: 0,
	},
};

async function getRecommendationCacheDebugSnapshot() {
	const context = getRecommendationCacheContext();
	const [suggestedMealCardResults, specialGuestPlanResults] =
		await Promise.all([
			getRecommendationCacheStoreStats('suggestedMealCardResults'),
			getRecommendationCacheStoreStats('specialGuestPlanResults'),
		]);
	return {
		capacities: {
			specialGuestPlanResults: {
				maxEntries: SPECIAL_GUEST_PLAN_CACHE_MAX_ENTRIES,
				maxLogicalWeight: SPECIAL_GUEST_PLAN_CACHE_MAX_MEALS,
			},
			suggestedMealCardResults: {
				maxEntries: SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
				maxLogicalWeight: SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
			},
		},
		context,
		resolution: {
			specialGuestPlan: { ...debugState.specialGuestPlan },
			suggestedMealCard: { ...debugState.suggestedMealCard },
		},
		stats: { specialGuestPlanResults, suggestedMealCardResults },
		versions: {
			algorithm: RECOMMENDATION_ALGORITHM_VERSION,
			database: RECOMMENDATION_CACHE_DATABASE_VERSION,
			epoch: RECOMMENDATION_CACHE_EPOCH,
			record: RECOMMENDATION_CACHE_RECORD_VERSION,
		},
	};
}

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export async function refreshRecommendationCacheDebugSnapshot() {
	if (PUBLIC_RUNTIME_CONFIG.nodeEnv === 'production' || isServer) {
		return;
	}
	const snapshot = await getRecommendationCacheDebugSnapshot();
	document.documentElement.dataset['recommendationCache'] =
		JSON.stringify(snapshot);
}

export function recordRecommendationCacheResolution(
	consumer: TRecommendationCacheConsumer,
	source: TRecommendationCacheResolutionSource
) {
	const state = debugState[consumer];
	state.latestSource = source;
	state[source]++;
	void refreshRecommendationCacheDebugSnapshot();
}
