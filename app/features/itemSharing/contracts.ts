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
	TIngredientId,
	TIngredientName,
} from '@/domain/data/ingredients/types';
import type { TPartnerId, TPartnerName } from '@/domain/data/partners/types';

export const ITEM_PREVIEW_PARAM_NAME = 'preview';
export const ITEM_SHARE_PARAM_NAME = 'select';

export type TItemRoutePath =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'decorations'
	| 'foods'
	| 'ingredients'
	| 'partners';

export type TShareableItemId =
	| TBeverageId
	| TClothesId
	| TCookerId
	| TCurrencyItemId
	| TDecorationId
	| TFoodId
	| TIngredientId
	| TPartnerId;

export type TShareableItemName =
	| TBeverageName
	| TClothesName
	| TCookerName
	| TCurrencyItemName
	| TDecorationName
	| TFoodName
	| TIngredientName
	| TPartnerName;
