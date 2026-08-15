import type { TMapLabel } from '@/domain/data/places/types';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

import type { IItemBase } from './itemSchema';
import type { TDescription } from './types';

export interface IGuestBase extends IItemBase {
	beverageTags: TBeverageTagId[];
	chat: TDescription[];
	maps: TMapLabel[];
	positiveTags: TFoodTagId[];
}
