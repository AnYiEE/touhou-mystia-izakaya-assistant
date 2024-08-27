import type {ICustomerRare} from '@/data/customer_rare/types';

export interface ICustomerSpecial extends ICustomerRare {}

export type TCustomerSpecials = typeof import('./data').CUSTOMER_SPECIAL_LIST;

export type TCustomerSpecialNames = TCustomerSpecials[number]['name'];
