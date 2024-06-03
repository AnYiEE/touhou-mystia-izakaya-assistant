import type {ICustomerBase} from '@/data/types';

interface ICustomerRare extends ICustomerBase {
	price: `${string}-${string}`;
}

export type {ICustomerRare};
