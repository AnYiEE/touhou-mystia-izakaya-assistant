import type { TClothesId } from '@/domain/data/clothes/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TDecorationId } from '@/domain/data/decorations/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TGeneralItemId } from '@/domain/data/generalItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TPartnerId } from '@/domain/data/partners/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

interface ILevelRewardEntry<TId extends number> {
	id: TId;
	level: number;
}

interface IBondRewardsResult {
	bondClothes: TClothesId | null;
	bondCooker: TCookerId | null;
	bondDecorations: Array<ILevelRewardEntry<TDecorationId>>;
	bondFoods: Array<ILevelRewardEntry<TFoodId>>;
	bondGeneralItems: Array<ILevelRewardEntry<TGeneralItemId>>;
	bondPartner: TPartnerId | null;
	collection: boolean;
	hasBondRewards: boolean;
}

export function getBondRewards({
	collection,
	getBondClothes,
	getBondCooker,
	getBondDecorations,
	getBondFoods,
	getBondGeneralItems,
	getBondPartner,
	specialGuest,
}: {
	collection: boolean;
	getBondClothes: (specialGuest: TSpecialGuestId) => TClothesId | null;
	getBondCooker: (specialGuest: TSpecialGuestId) => TCookerId | null;
	getBondDecorations: (
		specialGuest: TSpecialGuestId
	) => Array<ILevelRewardEntry<TDecorationId>>;
	getBondFoods: (
		specialGuest: TSpecialGuestId
	) => Array<ILevelRewardEntry<TFoodId>>;
	getBondGeneralItems: (
		specialGuest: TSpecialGuestId
	) => Array<ILevelRewardEntry<TGeneralItemId>>;
	getBondPartner: (specialGuest: TSpecialGuestId) => TPartnerId | null;
	specialGuest: TSpecialGuestId;
}): IBondRewardsResult {
	const bondClothes = getBondClothes(specialGuest);
	const bondCooker = getBondCooker(specialGuest);
	const bondDecorations = getBondDecorations(specialGuest);
	const bondFoods = getBondFoods(specialGuest);
	const bondGeneralItems = getBondGeneralItems(specialGuest);
	const bondPartner = getBondPartner(specialGuest);

	return {
		bondClothes,
		bondCooker,
		bondDecorations,
		bondFoods,
		bondGeneralItems,
		bondPartner,
		collection,
		hasBondRewards:
			collection ||
			bondClothes !== null ||
			bondCooker !== null ||
			bondPartner !== null ||
			!checkLengthEmpty(bondDecorations) ||
			!checkLengthEmpty(bondFoods) ||
			!checkLengthEmpty(bondGeneralItems),
	};
}
