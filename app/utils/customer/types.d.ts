import type {ICustomerBase} from '@/data/types';
import type {CustomerNormalNames} from '@/data/customer_normal';
import type {CustomerRareNames} from '@/data/customer_rare';

type CustomerNames = CustomerNormalNames | CustomerRareNames;

interface ICustomer<T extends CustomerNames = CustomerNames> extends ICustomerBase {
	name: T;
}

export type {ICustomer};
