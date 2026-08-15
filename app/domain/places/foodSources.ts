import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';

import { extractMapsFromCollectionPoint } from './collectionLocations';

type TFoodFrom = IFoodBase['from'] & { self?: boolean };

export function extractMapsFromFoodFrom(from: TFoodFrom) {
	if ('self' in from && from.self) {
		return ALL_MAP_LABELS;
	}
	if (Object.keys(from).length === 0) {
		return [];
	}

	const maps = new Set<TMapLabel>();

	from.buy?.forEach((item) => {
		const merchant = Array.isArray(item) ? item[0] : item;
		if ('map' in merchant) {
			maps.add(merchant.map);
		}
	});

	from.collect?.forEach((item) => {
		const collectionPoint = Array.isArray(item) ? item[0] : item;
		extractMapsFromCollectionPoint(collectionPoint).forEach((map) => {
			maps.add(map);
		});
	});

	from.fishing?.forEach((map) => maps.add(map));
	from.fishingAdvanced?.forEach((map) => maps.add(map));

	return [...maps];
}
