import {
	ALL_PLACES,
	ALL_PLACES_SET,
	CUSTOMER_RARE_LIST,
	type TCustomerRareName,
	type TPlace,
} from '@/data';

export const SOURCE_COLLABORATION_PLACE = '联动';

export type TSourcePlace = TPlace | typeof SOURCE_COLLABORATION_PLACE;

const SOURCE_PLACE_PATTERN = /【(.+?)】/gu;

let rareCustomerMainPlaceCache:
	| Array<{ name: TCustomerRareName; place: TPlace }>
	| undefined;

function getRareCustomerMainPlaces() {
	if (rareCustomerMainPlaceCache !== undefined) {
		return rareCustomerMainPlaceCache;
	}

	rareCustomerMainPlaceCache = CUSTOMER_RARE_LIST.map(({ name, places }) => {
		const [place] = places;

		return { name, place };
	});

	return rareCustomerMainPlaceCache;
}

function getKnownMapPlaceFromText(value: string) {
	if (ALL_PLACES_SET.has(value)) {
		return value as TPlace;
	}

	return ALL_PLACES.find((place) => value.startsWith(place)) ?? null;
}

function getRareCustomerMainPlaceFromText(value: string) {
	return (
		getRareCustomerMainPlaces().find(({ name }) => value.includes(name))
			?.place ?? null
	);
}

export function extractPrimaryMapPlaceFromSourceText(value: string) {
	for (const [, placeText] of value.matchAll(SOURCE_PLACE_PATTERN)) {
		if (placeText === undefined) {
			continue;
		}

		const place = getKnownMapPlaceFromText(placeText);

		if (place !== null) {
			return place;
		}
	}

	const directPlace = getKnownMapPlaceFromText(value);

	if (directPlace !== null) {
		return directPlace;
	}

	return getRareCustomerMainPlaceFromText(value);
}

export function extractSourcePlacesFromText(
	value: string,
	{ includeCollaboration = false }: { includeCollaboration?: boolean } = {}
) {
	const places = new Set<TSourcePlace>();

	for (const [, placeText] of value.matchAll(SOURCE_PLACE_PATTERN)) {
		if (placeText === undefined) {
			continue;
		}

		const place = getKnownMapPlaceFromText(placeText);

		if (place !== null) {
			places.add(place);
		}
	}

	const directPlace = getKnownMapPlaceFromText(value);

	if (directPlace !== null) {
		places.add(directPlace);
	}

	getRareCustomerMainPlaces().forEach(({ name, place }) => {
		if (value.includes(name)) {
			places.add(place);
		}
	});

	if (includeCollaboration && value.includes(SOURCE_COLLABORATION_PLACE)) {
		places.add(SOURCE_COLLABORATION_PLACE);
	}

	return [...places];
}
