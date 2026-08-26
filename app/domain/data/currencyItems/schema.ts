import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TPrayerLabel } from '@/domain/data/labels/prayerFacts';
import type { TMapLabel, TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TCurrencyItemId } from './types';

export type TCurrencyItemSource<TId extends number = TCurrencyItemId> =
	| { mapSideTask: { map: TMapLabel } }
	| { mapPrayer: { label: TPrayerLabel; map: TMapLabel } }
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
