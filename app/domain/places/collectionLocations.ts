import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';
import type {
	TCollectionPointReference,
	TMapLabel,
} from '@/domain/data/places/types';

export function extractMapsFromCollectionPoint(
	collectionPoint: TCollectionPointReference
): TMapLabel[] {
	if ('map' in collectionPoint) {
		return [collectionPoint.map];
	}

	const excludedMapLabelSet = new Set(collectionPoint.excludedMaps);

	return ALL_MAP_LABELS.filter((map) => !excludedMapLabelSet.has(map));
}
