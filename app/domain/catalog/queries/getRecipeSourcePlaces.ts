import type { ICustomerRare } from '@/domain/data/customers/rare/schema';
import { ALL_PLACES } from '@/domain/data/places/placeFacts';
import type { IRecipe } from '@/domain/data/recipes/schema';
import {
	type TSourcePlace,
	extractSourcePlacesFromText,
} from '@/domain/places/sourceText';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export function getRecipeSourcePlaces(
	from: IRecipe['from'],
	rareCustomers: ReadonlyArray<ICustomerRare>
) {
	if (typeof from === 'string') {
		const places = extractSourcePlacesFromText(from, {
			includeCollaboration: true,
		});

		return checkLengthEmpty(places) ? ALL_PLACES : places;
	}
	if (Object.keys(from).length === 0) {
		return [];
	}
	if ('self' in from) {
		return ALL_PLACES;
	}
	if ('bond' in from) {
		const { bond } = from;
		const customer = rareCustomers.find(({ name }) => name === bond.name);
		if (customer === undefined) {
			throw new Error(
				`[domain/catalog/queries/getRecipeSourcePlaces]: name \`${bond.name}\` not found`
			);
		}

		const [customerPlace] = customer.places;
		return [customerPlace as TSourcePlace];
	}

	const places = new Set<TSourcePlace>();

	if ('levelup' in from) {
		if (from.levelup[1] === null) {
			return ALL_PLACES;
		}
		places.add(from.levelup[1]);
	}

	if ('buy' in from) {
		extractSourcePlacesFromText(from.buy.name, {
			includeCollaboration: true,
		}).forEach((place) => {
			places.add(place);
		});
	}

	return checkLengthEmpty(places) ? ALL_PLACES : [...places];
}
