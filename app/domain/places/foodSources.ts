import { ALL_PLACES, ALL_PLACES_SET } from '@/domain/data/places/placeFacts';
import type { TPlace } from '@/domain/data/places/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';

import { extractPlacesFromCollectionLocation } from './collectionLocations';
import { PLACE_NAME_REGEX } from './parsePlace';

type TFoodFrom = IFoodBase['from'] & { self?: boolean };

export function extractPlacesFromFoodFrom(from: TFoodFrom) {
	if ('self' in from && from.self) {
		return ALL_PLACES;
	}
	if (Object.keys(from).length === 0) {
		return [];
	}

	const places = new Set<TPlace>();

	from.buy?.forEach((item) => {
		const merchant = typeof item === 'string' ? item : item[0];
		const match = PLACE_NAME_REGEX.exec(merchant);
		if (match?.[1] && ALL_PLACES_SET.has(match[1])) {
			places.add(match[1] as TPlace);
		}
	});

	from.collect?.forEach((item) => {
		const location = typeof item === 'string' ? item : item[0];
		extractPlacesFromCollectionLocation(location).forEach((place) => {
			places.add(place);
		});
	});

	from.fishing?.forEach((p) => places.add(p));
	from.fishingAdvanced?.forEach((p) => places.add(p));

	return [...places];
}
