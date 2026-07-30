import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { SITE_METADATA } from '@/shared/site/metadata';

import {
	RECOMMENDATION_ALGORITHM_VERSION,
	RECOMMENDATION_CACHE_EPOCH,
	RECOMMENDATION_CACHE_RECORD_VERSION,
} from './constants';
import {
	createRecommendationCacheNamespace,
	createRecommendationCacheRuntimeChannel,
	createRecommendationDataFingerprint,
} from './fingerprint';

let cachedContext: IRecommendationCacheContext | undefined;
let cachedRuntimeChannel: string | undefined;

export interface IRecommendationCacheContext {
	readonly databaseName: string;
	readonly namespace: string;
	readonly runtimeChannel: string;
}

export function getRecommendationCacheRuntimeChannel() {
	cachedRuntimeChannel ??= createRecommendationCacheRuntimeChannel(
		PUBLIC_RUNTIME_CONFIG.nodeEnv === 'production'
	);
	return cachedRuntimeChannel;
}

export function getRecommendationCacheDatabaseName() {
	return `${SITE_METADATA.id}:recommendation-cache:${getRecommendationCacheRuntimeChannel()}`;
}

export function getRecommendationCacheContext(): IRecommendationCacheContext {
	cachedContext ??= (() => {
		const runtimeChannel = getRecommendationCacheRuntimeChannel();
		const namespace = createRecommendationCacheNamespace({
			algorithmVersion: RECOMMENDATION_ALGORITHM_VERSION,
			dataFingerprint: createRecommendationDataFingerprint(),
			epoch: RECOMMENDATION_CACHE_EPOCH,
			recordVersion: RECOMMENDATION_CACHE_RECORD_VERSION,
		});
		return {
			databaseName: getRecommendationCacheDatabaseName(),
			namespace,
			runtimeChannel,
		};
	})();
	return cachedContext;
}
