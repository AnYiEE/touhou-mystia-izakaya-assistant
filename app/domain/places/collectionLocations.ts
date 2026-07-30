import { ALL_PLACES, ALL_PLACES_SET } from '@/domain/data/places/placeFacts';
import type { TCollectionLocation, TPlace } from '@/domain/data/places/types';

import { PLACE_NAME_REGEX } from './parsePlace';

const EXCLUDED_COLLECTION_PLACE_MAP = new Map<TCollectionLocation, TPlace>([
	['非【迷途竹林】河流', '迷途竹林'],
	['非【妖怪兽道】河流', '妖怪兽道'],
]);

export function extractPlacesFromCollectionLocation(
	location: TCollectionLocation
) {
	const excludedPlace = EXCLUDED_COLLECTION_PLACE_MAP.get(location);
	if (excludedPlace !== undefined) {
		return ALL_PLACES.filter((place) => place !== excludedPlace);
	}

	const match = PLACE_NAME_REGEX.exec(location);
	return match?.[1] !== undefined && ALL_PLACES_SET.has(match[1])
		? [match[1] as TPlace]
		: [];
}
