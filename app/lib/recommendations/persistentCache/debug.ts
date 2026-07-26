'use client';

import { siteConfig } from '@/configs';

import {
	CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES,
	CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS,
	RECOMMENDATION_ALGORITHM_VERSION,
	RECOMMENDATION_CACHE_DATABASE_VERSION,
	RECOMMENDATION_CACHE_EPOCH,
	RECOMMENDATION_CACHE_RECORD_VERSION,
	SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
	SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
} from './constants';
import { getRecommendationCacheContext } from './context';
import { getRecommendationCacheStoreStats } from './database';

type TRecommendationCacheConsumer = 'customerRarePlan' | 'suggestedMealCard';
type TRecommendationCacheResolutionSource = 'compute' | 'memory' | 'persistent';

interface IRecommendationCacheDebugConsumerState {
	compute: number;
	memory: number;
	persistent: number;
	latestSource: TRecommendationCacheResolutionSource | null;
}

interface IRecommendationCacheDebugState {
	customerRarePlan: IRecommendationCacheDebugConsumerState;
	suggestedMealCard: IRecommendationCacheDebugConsumerState;
}

const debugState: IRecommendationCacheDebugState = {
	customerRarePlan: {
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
	const [suggestedMealCardResults, customerRarePlanResults] =
		await Promise.all([
			getRecommendationCacheStoreStats('suggestedMealCardResults'),
			getRecommendationCacheStoreStats('customerRarePlanResults'),
		]);
	return {
		capacities: {
			customerRarePlanResults: {
				maxEntries: CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES,
				maxLogicalWeight: CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS,
			},
			suggestedMealCardResults: {
				maxEntries: SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES,
				maxLogicalWeight: SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS,
			},
		},
		context,
		resolution: {
			customerRarePlan: { ...debugState.customerRarePlan },
			suggestedMealCard: { ...debugState.suggestedMealCard },
		},
		stats: { customerRarePlanResults, suggestedMealCardResults },
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
	if (siteConfig.nodeEnv === 'production' || isServer) {
		return;
	}
	const snapshot = await getRecommendationCacheDebugSnapshot();
	globalThis.document.documentElement.dataset['recommendationCache'] =
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
