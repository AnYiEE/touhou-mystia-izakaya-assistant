import type {ICustomerBase} from '@/data/types';

export interface ICustomerSpecial extends ICustomerBase {
	price: `${string}-${string}`;
}

export type CustomerSpecials = typeof import('./data').CUSTOMER_SPECIAL_LIST;

export type CustomerSpecialNames = CustomerSpecials[number]['name'];
