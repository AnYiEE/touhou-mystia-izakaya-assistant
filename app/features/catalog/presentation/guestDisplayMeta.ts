import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapDisplayLabel } from '@/domain/data/places/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export function getNormalGuestDisplayMeta(
	guestCatalog: NormalGuestCatalog,
	guest: TNormalGuestId
): {
	hasOtherPlaces: boolean;
	mainPlace: TMapDisplayLabel | null;
	placeContent: string;
} {
	const { maps } = guestCatalog.getPropsById(guest);
	const places = maps.map((map) => MAP_FACTS[map].label);
	const [mainPlace = null, ...otherPlaces] = places;
	const hasOtherPlaces = !checkLengthEmpty(otherPlaces);

	return {
		hasOtherPlaces,
		mainPlace,
		placeContent: hasOtherPlaces
			? `其他出没地区：${otherPlaces.join('、')}`
			: '暂未收录其他出没地区',
	};
}

export function getSpecialGuestDisplayMeta(
	guestCatalog: SpecialGuestCatalog,
	guest: TSpecialGuestId
): {
	averagePrice: number;
	enduranceLimitPercent: number;
	hasEnduranceLimit: boolean;
	hasNegativeSpellCards: boolean;
	hasOtherPlaces: boolean;
	mainPlace: TMapDisplayLabel;
	placeContent: string;
} {
	const { enduranceLimit, maps, price, spellCards } =
		guestCatalog.getPropsById(guest);
	const places = maps.map((map) => MAP_FACTS[map].label);
	const [mainPlace, ...otherPlaces] = places;
	const hasOtherPlaces = !checkLengthEmpty(otherPlaces);
	const averagePrice = (price[0] + price[1]) / 2;
	const enduranceLimitPercent = Math.floor(enduranceLimit * 100 - 100);
	const hasNegativeSpellCards =
		'negative' in spellCards &&
		!checkLengthEmpty<unknown>(spellCards.negative);
	if (mainPlace === undefined) {
		throw new Error(
			`[features/catalog/presentation/guestDisplayMeta]: special guest id \`${guest}\` has no main map label`
		);
	}

	return {
		averagePrice,
		enduranceLimitPercent,
		hasEnduranceLimit: enduranceLimitPercent > 0,
		hasNegativeSpellCards,
		hasOtherPlaces,
		mainPlace,
		placeContent: hasOtherPlaces
			? `其他出没地区：${otherPlaces.join('、')}`
			: '暂未收录其他出没地区',
	};
}
