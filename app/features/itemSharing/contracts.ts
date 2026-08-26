import type { TBadgeId, TBadgeName } from '@/domain/data/badges/types';
import type { TBeverageId, TBeverageName } from '@/domain/data/beverages/types';
import type { TClothesId, TClothesName } from '@/domain/data/clothes/types';
import type { TCookerId, TCookerName } from '@/domain/data/cookers/types';
import type {
	TCurrencyItemId,
	TCurrencyItemName,
} from '@/domain/data/currencyItems/types';
import type {
	TDecorationId,
	TDecorationName,
} from '@/domain/data/decorations/types';
import type { TFoodId, TFoodName } from '@/domain/data/foods/types';
import type {
	TFishingCollectibleId,
	TFishingCollectibleName,
} from '@/domain/data/fishingCollectibles/types';
import type {
	TGeneralItemId,
	TGeneralItemName,
} from '@/domain/data/generalItems/types';
import type {
	TIngredientId,
	TIngredientName,
} from '@/domain/data/ingredients/types';
import type { TPartnerId, TPartnerName } from '@/domain/data/partners/types';
import type { TRecordId, TRecordName } from '@/domain/data/records/types';

export const ITEM_PREVIEW_PARAM_NAME = 'preview';
export const ITEM_SHARE_PARAM_NAME = 'select';

export type TItemRoutePath =
	| 'badges'
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'decorations'
	| 'foods'
	| 'fishing-collectibles'
	| 'ingredients'
	| 'items'
	| 'partners'
	| 'records';

export type TShareableItemId =
	| TBadgeId
	| TBeverageId
	| TClothesId
	| TCookerId
	| TCurrencyItemId
	| TDecorationId
	| TFoodId
	| TFishingCollectibleId
	| TGeneralItemId
	| TIngredientId
	| TPartnerId
	| TRecordId;

export type TShareableItemName =
	| TBadgeName
	| TBeverageName
	| TClothesName
	| TCookerName
	| TCurrencyItemName
	| TDecorationName
	| TFoodName
	| TFishingCollectibleName
	| TGeneralItemName
	| TIngredientName
	| TPartnerName
	| TRecordName;
