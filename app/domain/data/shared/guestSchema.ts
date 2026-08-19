import type { TMapLabel } from '@/domain/data/places/types';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

import type { IItemBase } from './itemSchema';

export interface IGuestBase extends IItemBase {
	beverageTags: TBeverageTagId[];
	chat: string[];
	maps: TMapLabel[];
	positiveTags: TFoodTagId[];
}
