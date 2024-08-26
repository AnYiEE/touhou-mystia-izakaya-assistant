import {type TCustomerNames} from '@/data';
import type {ICustomerBase} from '@/data/types';

export interface ICustomer<T extends TCustomerNames = TCustomerNames> extends ICustomerBase {
	name: T;
}
