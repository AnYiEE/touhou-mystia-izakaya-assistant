import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMapLabel, TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TCurrencyItemId } from './types';

type TPrayerLocationLabel = '西侧守矢分社';

export type TCurrencyItemSource<TId extends number = TCurrencyItemId> =
	| { mapSideTask: { map: TMapLabel } }
	| { mapPrayer: { locationLabel: TPrayerLocationLabel; map: TMapLabel } }
	| {
			buy: {
				merchant: TMerchantReference;
				price: { amount: number; currencyItem: TId };
			};
	  }
	| { spellCardReward: { specialGuest: TSpecialGuestId } };

export interface ICurrencyItem<
	TId extends number = TCurrencyItemId,
> extends IItemBase {
	from: Array<TCurrencyItemSource<TId>>;
	id: TId;
}
