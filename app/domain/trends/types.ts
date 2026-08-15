import {
	type DARK_MATTER_META_MAP,
	type DYNAMIC_FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

export type TPopularFoodTagId = Exclude<
	TFoodTagId,
	| 4000
	| 5000
	| (typeof DARK_MATTER_META_MAP)['positiveTag']
	| (typeof DYNAMIC_FOOD_TAG_MAP)['popularNegative' | 'popularPositive']
>;

export interface IPopularTrend {
	isNegative: boolean;
	tag: TPopularFoodTagId | null;
}
