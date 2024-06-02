import type {ICustomerBase} from '@data';

interface ICustomerRare extends ICustomerBase {
	price: `${string}-${string}`;
}

export type {ICustomerRare};
