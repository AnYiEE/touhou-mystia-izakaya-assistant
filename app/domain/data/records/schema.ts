import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TMerchantLabel } from '@/domain/data/places/merchantFacts';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TRecordId } from './types';

export interface IRecord<TId extends number = TRecordId> extends IItemBase {
	buy: {
		merchant: TMerchantLabel;
		prices: Array<{ amount: number; currencyItem: TCurrencyItemId }>;
	};
	composer: string;
	id: TId;
	musicLabel: string;
	original: string;
	trackName: string;
}
