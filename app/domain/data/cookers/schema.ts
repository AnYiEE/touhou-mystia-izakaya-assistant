import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDescription } from '@/domain/data/shared/types';

import type { TCookerSeriesId, TCookerTypeId } from './types';

type TCookerPricePart =
	| { currencyItem: { amount: number; currencyItem: TCurrencyItemId } }
	| { money: { amount: number } };

export type TCookerSource =
	| { self: true }
	| { bond: { level: 5; specialGuest: TSpecialGuestId } }
	| {
			buy: {
				merchant: TMerchantReference;
				price: [TCookerPricePart, ...TCookerPricePart[]];
			};
	  }
	| { dlcSideTask: { dlc: 1; task: '支线任务' } }
	| { competitionReward: { competitionLabel: '怪诞料理大赛' } };

export interface ICooker extends IItemBase {
	availableTypes: TCookerTypeId[];
	/** @description If it is an array, the first element represents the effect, and the second element represents whether it is a mystia only effect. */
	effect: TDescription | [TDescription, boolean] | null;
	from: TCookerSource[];
	series: TCookerSeriesId;
}
