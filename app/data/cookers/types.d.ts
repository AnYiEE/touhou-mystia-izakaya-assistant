import {type TCurrencyName, type TCustomerRareName} from '@/data';
import type {IItemBase, TDescription, TMerchant} from '@/data/types';

type TCategory = 'DLC' | '初始' | '夜雀' | '超' | '极' | '核能' | '可疑' | '月见';

type TType = '煮锅' | '烧烤架' | '油锅' | '蒸锅' | '料理台';

export interface ICooker extends IItemBase {
	type: TType | TType[];
	category: TCategory;
	/** @description If it is an array, the first element represents the effect, and the second element represents whether it is a mystia only effect. */
	effect: TDescription | [TDescription, boolean] | null;
	from: Array<
		| string
		| Partial<{
				bond: TCustomerRareName;
				buy: {
					name: TMerchant;
					price: Array<
						| number
						| {
								currency: TCurrencyName;
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

export type TCookerName = TCookers[number]['name'];
export type TCookerCategory = TCookers[number]['category'];
export type TCookerType = FlatArray<TCookers[number]['type'], 1>;
