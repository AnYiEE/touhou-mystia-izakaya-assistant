import { siteConfig } from '@/configs';

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
		siteConfig.nodeEnv === 'production'
	);
	return cachedRuntimeChannel;
}

export function getRecommendationCacheDatabaseName() {
	return `${siteConfig.id}:recommendation-cache:${getRecommendationCacheRuntimeChannel()}`;
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
