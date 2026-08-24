import { type TRecommendationSortProfile } from './sortProfiles';

export const RECOMMENDATION_SORT_PROFILE_LABEL_MAP = {
	'availability-first': '容易获取',
	'high-price': '高价优先',
	'low-price': '低价优先',
	'material-cost-first': '少料易做',
} as const satisfies Record<TRecommendationSortProfile, string>;
