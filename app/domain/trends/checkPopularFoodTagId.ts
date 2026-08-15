import {
	DARK_MATTER_META_MAP,
	DYNAMIC_FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import type { TPopularFoodTagId } from './types';

export function checkPopularFoodTagId(
	tag: TFoodTagId
): tag is TPopularFoodTagId {
	return (
		tag !== DARK_MATTER_META_MAP.positiveTag &&
		tag !== DYNAMIC_FOOD_TAG_MAP.popularNegative &&
		tag !== DYNAMIC_FOOD_TAG_MAP.popularPositive &&
		tag !== 4000 &&
		tag !== 5000
	);
}
