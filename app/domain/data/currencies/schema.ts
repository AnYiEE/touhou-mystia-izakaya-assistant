import type { TMerchant, TPlace } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

export interface ICurrency extends IItemBase {
	from: Array<
		| string
		| Partial<{
				buy: {
					name: TMerchant;
					price: { currency: string; amount: number }; // TCurrencyName
				};
				task: TPlace;
		  }>
	>;
}
