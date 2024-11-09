import {CURRENCY_LIST, type TCurrencies} from '@/data';
import {Item} from '@/utils/item';

export class Currency extends Item<TCurrencies> {
	private static _instance: Currency | undefined;

	public static getInstance() {
		if (Currency._instance !== undefined) {
			return Currency._instance;
		}

		const instance = new Currency(CURRENCY_LIST);

		Currency._instance = instance;

		return instance;
	}
}
