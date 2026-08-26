import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TMerchantReference } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

export type TClothesSource =
	| { self: true }
	| { bond: { level: 5; specialGuest: TSpecialGuestId } }
	| {
			buy: {
				merchant: TMerchantReference;
				price: {
					currencyItem: {
						amount: number;
						currencyItem: TCurrencyItemId;
					};
				};
			};
	  }
	| { holdingRequirement: { amount: 100; currencyItem: TCurrencyItemId } }
	| {
			eventReward: {
				eventLabel: Extract<
					TSchedulerLabel,
					'Main_5_BambooForest_Concert_Post'
				>;
			};
	  }
	| {
			collaborationUnlock: {
				collaborationLabel: Extract<TCollaborationLabel, 'THYG'>;
			};
	  }
	| {
			taskReward: {
				task: Extract<TSchedulerLabel, 'DLCMusic_Main_AllPass_Event'>;
			};
	  };

export interface IClothes extends IItemBase {
	from: TClothesSource[];
	/** @description Whether the tachie image of the clothes is a gif. */
	gif: boolean;
	/** @description Whether the clothes will change the izakaya skin. */
	izakaya: boolean;
}
