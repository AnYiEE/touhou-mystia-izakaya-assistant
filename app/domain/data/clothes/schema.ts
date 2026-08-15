import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
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
	| { eventReward: { eventLabel: '首次举办演唱会' } }
	| { collaborationUnlock: { collaborationLabel: '东方妖精武踏会' } }
	| { taskReward: { task: '爱乐者的挑战赛' } };

export interface IClothes extends IItemBase {
	from: TClothesSource[];
	/** @description Whether the tachie image of the clothes is a gif. */
	gif: boolean;
	/** @description Whether the clothes will change the izakaya skin. */
	izakaya: boolean;
}
