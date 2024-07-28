import type {ICustomerBase, TRecipeTag} from '@/data/types';

export interface ICustomerRare extends ICustomerBase {
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${string}-${string}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareNames = TCustomerRares[number]['name'];
