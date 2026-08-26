import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TGeneralItemId } from './types';

export type TGeneralItemSource =
	| { holdingCurrencyItem: { amount: number; currencyItem: TCurrencyItemId } }
	| { positiveSpellCard: TSpecialGuestId }
	| { schedulerLabel: TSchedulerLabel }
	| { taskReward: TSchedulerLabel };

export interface IGeneralItem<
	TId extends number = TGeneralItemId,
> extends IItemBase {
	effects: string[];
	from: TGeneralItemSource[];
	id: TId;
}
