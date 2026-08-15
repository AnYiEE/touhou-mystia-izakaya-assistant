import type { IFood } from '@/domain/data/foods/schema';
import type { TSpecialGuests } from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';
import type { TMapLabel, TMerchantReference } from '@/domain/data/places/types';

export interface IFoodSourceMapMetadata {
	isCollaborationSource: boolean;
	maps: TMapLabel[];
}

function getSpecialGuestMainMap(
	specialGuestId: TSpecialGuests[number]['id'],
	specialGuests: ReadonlyArray<TSpecialGuests[number]>
) {
	const specialGuest = specialGuests.find(({ id }) => id === specialGuestId);
	const map = specialGuest?.maps[0];
	if (map === undefined) {
		throw new Error(
			`[domain/catalog/queries/getFoodSourceMapMetadata]: specialGuestId \`${specialGuestId}\` has no main mapLabel`
		);
	}

	return map;
}

function getMerchantMap(
	merchant: TMerchantReference,
	specialGuests: ReadonlyArray<TSpecialGuests[number]>
) {
	return 'map' in merchant
		? merchant.map
		: getSpecialGuestMainMap(merchant.specialGuest, specialGuests);
}

function createMetadata(
	maps: TMapLabel[],
	isCollaborationSource = false
): IFoodSourceMapMetadata {
	return { isCollaborationSource, maps };
}

export function getFoodSourceMapMetadata(
	from: IFood['from'],
	specialGuests: ReadonlyArray<TSpecialGuests[number]>
): IFoodSourceMapMetadata {
	if ('self' in from) {
		return createMetadata([...ALL_MAP_LABELS]);
	}
	if ('bond' in from) {
		return createMetadata([
			getSpecialGuestMainMap(from.bond.specialGuest, specialGuests),
		]);
	}
	if ('levelup' in from) {
		return createMetadata(
			from.levelup.map === null ? [...ALL_MAP_LABELS] : [from.levelup.map]
		);
	}
	if ('buy' in from) {
		return createMetadata([
			getMerchantMap(from.buy.merchant, specialGuests),
		]);
	}
	if ('areaTask' in from) {
		return createMetadata([from.areaTask.map]);
	}
	if ('collaboration' in from) {
		return createMetadata(
			[
				...new Set(
					from.collaboration.merchants.map(({ merchant }) =>
						getMerchantMap(merchant, specialGuests)
					)
				),
			],
			true
		);
	}

	const punishmentSpecialGuestSet = new Set(
		from.failedCooking.punishmentSpellCardSpecialGuests
	);
	const punishmentSpecialGuests = specialGuests.filter(({ id }) =>
		punishmentSpecialGuestSet.has(id)
	);
	if (punishmentSpecialGuests.length !== punishmentSpecialGuestSet.size) {
		throw new Error(
			'[domain/catalog/queries/getFoodSourceMapMetadata]: failedCooking contains an unknown specialGuestId'
		);
	}

	return createMetadata(
		punishmentSpecialGuests.map(({ maps: [map] }) => map)
	);
}
