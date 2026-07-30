import { type CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { type CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TPlace } from '@/domain/data/places/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

export function getCustomerNormalDisplayMeta(
	customer: CustomerNormal,
	name: TCustomerNormalName
): { hasOtherPlaces: boolean; mainPlace: TPlace | null; placeContent: string } {
	const { places } = customer.getPropsByName(name);
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

export function getCustomerRareDisplayMeta(
	customer: CustomerRare,
	name: TCustomerRareName
): {
	averagePrice: number;
	enduranceLimitPercent: number;
	hasEnduranceLimit: boolean;
	hasNegativeSpellCards: boolean;
	hasOtherPlaces: boolean;
	mainPlace: TPlace;
	placeContent: string;
} {
	const { enduranceLimit, places, price, spellCards } =
		customer.getPropsByName(name);
	const [mainPlace, ...otherPlaces] = places;
	const hasOtherPlaces = !checkLengthEmpty(otherPlaces);
	const averagePrice = (price[0] + price[1]) / 2;
	const enduranceLimitPercent = Math.floor(enduranceLimit * 100 - 100);
	const hasNegativeSpellCards =
		'negative' in spellCards &&
		!checkLengthEmpty<unknown>(spellCards.negative);

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
