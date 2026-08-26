import type { IItemBase } from '@/domain/data/shared/itemSchema';

import type { TBadgeId } from './types';

export interface IBadge<TId extends number = TBadgeId> extends IItemBase {
	id: TId;
}
