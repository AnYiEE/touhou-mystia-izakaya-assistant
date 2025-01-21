import {type TCurrencyId, type TCustomerRareId} from '@/data';
import {type COOKER_CATEGORY_MAP, type COOKER_TYPE_MAP} from '@/data/constant';
import type {IItemBase, TDescription, TMerchant} from '@/data/types';

type TCategoryId = keyof typeof COOKER_CATEGORY_MAP;

type TTypeId = keyof typeof COOKER_TYPE_MAP;

export interface ICooker extends IItemBase {
	type: TTypeId | TTypeId[];
	category: TCategoryId;
	/** @description If it is an array, the first element represents the effect, and the second element represents whether it is a mystia only effect. */
	effect: TDescription | [TDescription, boolean] | null;
	from: Array<
		| string
		| Partial<{
				bond: TCustomerRareId;
				buy: {
					name: TMerchant;
					price: Array<
						| number
						| {
								currency: TCurrencyId;
								amount: number;
						  }
					>;
				};
				/** @description Initial cookers. */
				self: true;
		  }>
	>;
}

export type TCookers = typeof import('./data').COOKER_LIST;

export type TCookerId = TCookers[number]['id'];
export type TCookerName = TCookers[number]['name'];
export type TCookerCategoryId = TCookers[number]['category'];
export type TCookerTypeId = FlatArray<TCookers[number]['type'], 1>;
