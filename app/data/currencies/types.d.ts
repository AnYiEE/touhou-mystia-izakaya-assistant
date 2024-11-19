import {type TPlaceId} from '@/data';
import type {IItemBase, TMerchant} from '@/data/types';

export interface ICurrency extends IItemBase {
	from: Array<
		| string
		| Partial<{
				buy: {
					name: TMerchant;
					price: {
						currency: string; // TCurrencyName
						amount: number;
					};
				};
				task: TPlaceId;
		  }>
	>;
}

export type TCurrencies = typeof import('./data').CURRENCY_LIST;

export type TCurrencyId = TCurrencies[number]['id'];
export type TCurrencyName = TCurrencies[number]['name'];
