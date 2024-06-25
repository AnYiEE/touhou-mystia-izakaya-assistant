import type {ICustomerBase} from '@/data/types';

export interface ICustomerRare extends ICustomerBase {
	price: `${string}-${string}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareNames = TCustomerRares[number]['name'];
