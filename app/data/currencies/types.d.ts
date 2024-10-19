import type {IItemBase, TPlace} from '@/data/types';

export interface ICurrency extends IItemBase {
	from:
		| {
				task: TPlace;
		  }
		| string;
}

export type TCurrencies = typeof import('./data').CURRENCY_LIST;

export type TCurrencyNames = TCurrencies[number]['name'];
