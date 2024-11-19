import {type TCurrencyId, type TCustomerRareId} from '@/data';
import type {IItemBase, TMerchant} from '@/data/types';

export interface IClothes extends IItemBase {
	/** @description Whether the tachie image of the clothes is a gif. */
	gif: boolean;
	/** @description Whether the clothes will change the izakaya skin. */
	izakaya: boolean;
	from: Array<
		| string
		| Partial<{
				bond: TCustomerRareId;
				buy: {
					name: TMerchant;
					price: {
						currency: TCurrencyId;
						amount: number;
					};
				};
				/** @description Initial clothes. */
				self: true;
		  }>
	>;
}

export type TClothes = typeof import('./data').CLOTHES_LIST;

export type TClothesId = TClothes[number]['id'];
export type TClothesName = TClothes[number]['name'];
