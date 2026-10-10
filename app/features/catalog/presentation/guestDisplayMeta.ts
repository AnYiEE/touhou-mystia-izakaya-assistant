import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { getMapLabel } from '@/domain/places/localizedLabels';

import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

function formatPlaceContent(
	otherPlaces: ReadonlyArray<string>,
	hasOtherPlaces: boolean,
	locale: TLocale
) {
	if (!hasOtherPlaces) {
		return translate(catalogGuestsMessages, locale, 'guests.place.none');
	}

	return translate(
		catalogGuestsMessages,
		locale,
		'guests.place.otherPlaces',
		{
			places: otherPlaces.join(
				translate(catalogGuestsMessages, locale, 'guests.listSeparator')
			),
		}
	);
}

export function getNormalGuestDisplayMeta(
	guestCatalog: NormalGuestCatalog,
	guest: TNormalGuestId,
	locale: TLocale
): { hasOtherPlaces: boolean; mainPlace: null | string; placeContent: string } {
	const { maps } = guestCatalog.getPropsById(guest);
	const places = maps.map((map) => getMapLabel(map));
	const [mainPlace = null, ...otherPlaces] = places;
	const hasOtherPlaces = !checkLengthEmpty(otherPlaces);

	return {
		hasOtherPlaces,
		mainPlace,
		placeContent: formatPlaceContent(otherPlaces, hasOtherPlaces, locale),
	};
}

export function getSpecialGuestDisplayMeta(
	guestCatalog: SpecialGuestCatalog,
	guest: TSpecialGuestId,
	locale: TLocale
): {
	averagePrice: number;
	enduranceLimitPercent: number;
	hasEnduranceLimit: boolean;
	hasNegativeSpellCards: boolean;
	hasOtherPlaces: boolean;
	mainPlace: string;
	placeContent: string;
} {
	const { enduranceLimit, maps, price, spellCards } =
		guestCatalog.getPropsById(guest);
	const places = maps.map((map) => getMapLabel(map));
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
		placeContent: formatPlaceContent(otherPlaces, hasOtherPlaces, locale),
	};
}
