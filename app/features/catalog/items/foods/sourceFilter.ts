import type { TMapLabel } from '@/domain/data/places/types';
import { getMapLabel } from '@/domain/places/localizedLabels';

export const FOOD_COLLABORATION_SOURCE_FILTER = '联动' as const;

export type TFoodSourceFilter =
	TMapLabel | typeof FOOD_COLLABORATION_SOURCE_FILTER;

export function getFoodSourceFilterLabel(source: TFoodSourceFilter) {
	return source === FOOD_COLLABORATION_SOURCE_FILTER
		? source
		: getMapLabel(source);
}
