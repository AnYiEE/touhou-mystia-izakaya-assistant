import type {ICustomerBase} from '@/data/types';

export interface ICustomerRare extends ICustomerBase {
	price: `${string}-${string}`;
}

export type CustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type CustomerRareNames = CustomerRares[number]['name'];
