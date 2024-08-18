import type {TReward} from '@/data/customer_rare/types';
import type {ICustomerBase} from '@/data/types';

export interface ICustomerSpecial extends ICustomerBase {
	bondRewards: TReward[];
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${number}-${number}`;
}

export type TCustomerSpecials = typeof import('./data').CUSTOMER_SPECIAL_LIST;

export type TCustomerSpecialNames = TCustomerSpecials[number]['name'];
