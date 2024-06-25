import type {ICustomerBase} from '@/data/types';

export interface ICustomerSpecial extends ICustomerBase {
	price: `${string}-${string}`;
}

export type TCustomerSpecials = typeof import('./data').CUSTOMER_SPECIAL_LIST;

export type TCustomerSpecialNames = TCustomerSpecials[number]['name'];
