import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TCookerSeriesId, TCookerTypeId } from './types';

type TCookerPricePart =
	| { cooker: { amount: number; cooker: number } }
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
	| {
			competitionReward: {
				competitionLabel: Extract<
					TSchedulerLabel,
					'DLC2_Main_FormerHell_WeirdCooking_FirstChallengeSuccess_Event'
				>;
			};
	  };

export interface ICooker extends IItemBase {
	availableTypes: TCookerTypeId[];
	/** @description If it is an array, the first element represents the effect, and the second element represents whether it is a mystia only effect. */
	effect: string | [string, boolean] | null;
	from: TCookerSource[];
	series: TCookerSeriesId;
}
