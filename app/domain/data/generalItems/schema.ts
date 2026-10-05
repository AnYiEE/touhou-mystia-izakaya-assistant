import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TSchedulerLabel } from '@/domain/data/labels/schedulerFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TGeneralItemId } from './types';

export type TGeneralItemSource =
	| { areaTask: { map: TMapLabel; task: '主线任务' | '支线任务' } }
	| {
			collaborationUnlock: {
				collaborationLabel: Extract<
					TCollaborationLabel,
					'ResourceEx_GiftMailbox'
				>;
			};
	  }
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
