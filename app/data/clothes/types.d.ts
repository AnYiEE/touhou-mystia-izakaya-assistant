import {type TCustomerRareNames} from '@/data';
import type {IItemBase, TBusinessman} from '@/data/types';

export interface IClothes extends IItemBase {
	/** @description Whether the tachie image of the clothes is a gif. */
	gif: boolean;
	/** @description Whether the clothes will change the izakaya skin. */
	izakaya: boolean;
	from:
		| Partial<{
				bond: TCustomerRareNames;
				buy: TBusinessman;
				/** @description Initial clothes. */
				self: true;
		  }>
		| string;
}

export type TClothes = typeof import('./data').CLOTHES_LIST;

export type TClothesNames = TClothes[number]['name'];
