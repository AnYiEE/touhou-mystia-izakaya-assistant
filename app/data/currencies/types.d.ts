import type {IItemBase, TMerchant, TPlace} from '@/data/types';

export interface ICurrency extends IItemBase {
	from: Array<
		| string
		| Partial<{
				buy: {
					name: TMerchant;
					price: {
						currency: string; // TCurrencyNames
						amount: number;
					};
				};
				task: TPlace;
		  }>
	>;
}

export type TCurrencies = typeof import('./data').CURRENCY_LIST;

export type TCurrencyNames = TCurrencies[number]['name'];
