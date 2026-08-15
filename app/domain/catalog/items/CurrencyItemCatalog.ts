import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import type { TCurrencyItems } from '@/domain/data/currencyItems/types';

export class CurrencyItemCatalog extends RecordCatalog<TCurrencyItems> {
	private static _instance: CurrencyItemCatalog | undefined;

	public static getInstance() {
		if (CurrencyItemCatalog._instance !== undefined) {
			return CurrencyItemCatalog._instance;
		}

		const instance = new CurrencyItemCatalog(
			CURRENCY_ITEM_LIST,
			'currencyItem'
		);
		CurrencyItemCatalog._instance = instance;

		return instance;
	}
}
