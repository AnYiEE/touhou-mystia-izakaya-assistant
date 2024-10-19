import {type TCurrencyNames, type TCustomerRareNames} from '@/data';
import type {IItemBase, TBusinessman} from '@/data/types';

type TCategory = 'DLC' | '超' | '初始' | '核能' | '极' | '可疑' | '夜雀' | '月见';

type TType = '烤架' | '料理台' | '油锅' | '蒸锅' | '煮锅';

export interface ICooker extends IItemBase {
	type: TType | TType[];
	category: TCategory;
	/** @description If it is an array, the first element represents the effect, and the second element represents whether it is a mystia only effect. */
	effect: `${string}。` | [`${string}。`, boolean] | null;
	from: Array<
		| Partial<{
				bond: TCustomerRareNames;
				buy: {
					name: TBusinessman;
					price: Array<
						| {
								currency: TCurrencyNames;
								amount: number;
						  }
						| number
					> | null;
				};
				/** @description Initial cookers. */
				self: true;
		  }>
		| string
	>;
}

export type TCookers = typeof import('./data').COOKER_LIST;

export type TCookerNames = TCookers[number]['name'];
export type TCookerCategories = TCookers[number]['category'];
export type TCookerTypes = FlatArray<TCookers[number]['type'], 1>;
