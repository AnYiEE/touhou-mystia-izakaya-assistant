import type { ICustomerBase } from '@/domain/data/shared/customerSchema';
import type { TCustomerName } from '@/domain/data/types';

export interface ICustomer<
	T extends TCustomerName = TCustomerName,
> extends ICustomerBase {
	name: T;
}
