import {type CustomerNames} from '@/data';
import type {ICustomerBase} from '@/data/types';

interface ICustomer<T extends CustomerNames = CustomerNames> extends ICustomerBase {
	name: T;
}

export type {ICustomer};
