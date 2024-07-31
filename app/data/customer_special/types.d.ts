import type {ICustomerBase} from '@/data/types';

export interface ICustomerSpecial extends ICustomerBase {
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${number}-${number}`;
}

export type TCustomerSpecials = typeof import('./data').CUSTOMER_SPECIAL_LIST;

export type TCustomerSpecialNames = TCustomerSpecials[number]['name'];
