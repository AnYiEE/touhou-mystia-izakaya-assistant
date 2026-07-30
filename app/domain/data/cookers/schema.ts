import type { TCurrencyName } from '@/domain/data/currencies/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TMerchant } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDescription } from '@/domain/data/shared/types';

type TCategory =
	| 'DLC'
	| '初始'
	| '夜雀'
	| '超'
	| '极'
	| '核能'
	| '可疑'
	| '月见';
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
						number | { currency: TCurrencyName; amount: number }
					>;
				};
				/** @description Initial cookers. */
				self: true;
		  }>
	>;
}
