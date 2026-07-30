import type { TClothesName } from '@/domain/data/clothes/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCurrencyName } from '@/domain/data/currencies/types';
import type { TOrnamentName } from '@/domain/data/ornaments/types';
import type { TPartnerName } from '@/domain/data/partners/types';
import type { TFoodName } from '@/domain/data/types';

export const ITEM_PREVIEW_PARAM_NAME = 'preview';
export const ITEM_SHARE_PARAM_NAME = 'select';

export type TItemRoutePath =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'ingredients'
	| 'ornaments'
	| 'partners'
	| 'recipes';

export type TShareableItemName =
	| TClothesName
	| TCookerName
	| TCurrencyName
	| TFoodName
	| TOrnamentName
	| TPartnerName;
