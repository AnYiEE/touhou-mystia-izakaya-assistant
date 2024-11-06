import type {IItemBase, TPlace} from '@/data/types';

export interface ICurrency extends IItemBase {
	from:
		| string
		| {
				task: TPlace;
		  };
}

export type TCurrencies = typeof import('./data').CURRENCY_LIST;

export type TCurrencyNames = TCurrencies[number]['name'];
