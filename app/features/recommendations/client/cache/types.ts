import { type DBSchema } from 'idb';

export type TRecommendationCacheResultStoreName =
	| 'customerRarePlanResults'
	| 'suggestedMealCardResults';

export interface IRecommendationCacheRecord {
	createdAt: number;
	id: string;
	lastAccessedAt: number;
	logicalWeight: number;
	namespace: string;
	recordVersion: number;
	requestKey: string;
	result: unknown;
}

export interface IRecommendationCacheMetadata {
	entryCount: number;
	id: string;
	logicalWeight: number;
	namespace: string;
	storeName: TRecommendationCacheResultStoreName;
}

interface IRecommendationCacheResultStore {
	indexes: { namespace: string; namespaceLastAccessedAt: [string, number] };
	key: string;
	value: IRecommendationCacheRecord;
}

export interface IRecommendationCacheDatabase extends DBSchema {
	customerRarePlanResults: IRecommendationCacheResultStore;
	metadata: { key: string; value: IRecommendationCacheMetadata };
	suggestedMealCardResults: IRecommendationCacheResultStore;
}

export interface IRecommendationCacheStoreLimits {
	readonly maxEntries: number;
	readonly maxLogicalWeight: number;
}

export interface IRecommendationCacheStoreStats {
	readonly entryCount: number;
	readonly logicalWeight: number;
}
