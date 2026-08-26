import type { TMapLabel } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDlc } from '@/domain/data/shared/types';

import type { TFishingCollectibleId } from './types';

export interface IFishingCollectible<
	TId extends number = TFishingCollectibleId,
> extends IItemBase {
	id: TId;
	map: TMapLabel;
	requiredContentDlc: TDlc;
}
