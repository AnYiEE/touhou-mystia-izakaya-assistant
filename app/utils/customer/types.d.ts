import {type TCustomerName} from '@/data';
import type {ICustomerBase} from '@/data/types';

export interface ICustomer<T extends TCustomerName = TCustomerName> extends ICustomerBase {
	name: T;
}
