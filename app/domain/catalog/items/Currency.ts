import { Item } from '@/domain/catalog/shared/Item';
import { CURRENCY_LIST } from '@/domain/data/currencies/records';
import type { TCurrencies } from '@/domain/data/currencies/types';

export class Currency extends Item<TCurrencies> {
	private static _instance: Currency | undefined;

	public static getInstance() {
		if (Currency._instance !== undefined) {
			return Currency._instance;
		}

		const instance = new Currency(CURRENCY_LIST, 'currency');

		Currency._instance = instance;

		return instance;
	}
}
