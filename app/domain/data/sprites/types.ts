import type { TBadgeId, TBadges } from '@/domain/data/badges/types';
import type { TBeverageId, TBeverages } from '@/domain/data/beverages/types';
import type { TClothes, TClothesId } from '@/domain/data/clothes/types';
import type { TCookerId, TCookers } from '@/domain/data/cookers/types';
import type {
	TCurrencyItemId,
	TCurrencyItems,
} from '@/domain/data/currencyItems/types';
import type {
	TDecorationId,
	TDecorations,
} from '@/domain/data/decorations/types';
import type { TFoodId, TFoods } from '@/domain/data/foods/types';
import type {
	TFishingCollectibleId,
	TFishingCollectibles,
} from '@/domain/data/fishingCollectibles/types';
import type {
	TGeneralItemId,
	TGeneralItems,
} from '@/domain/data/generalItems/types';
import type {
	TNormalGuestId,
	TNormalGuests,
} from '@/domain/data/guests/normal/types';
import type {
	TSpecialGuestId,
	TSpecialGuests,
} from '@/domain/data/guests/special/types';
import type {
	TIngredientId,
	TIngredients,
} from '@/domain/data/ingredients/types';
import type { TPartnerId, TPartners } from '@/domain/data/partners/types';
import type { TRecordId, TRecords } from '@/domain/data/records/types';

export type TSpriteTarget =
	| 'badge'
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'currency_item'
	| 'decoration'
	| 'food'
	| 'ingredient'
	| 'item'
	| 'normal_guest'
	| 'partner'
	| 'record'
	| 'special_guest'
	| 'trophy';

interface ISpriteDataMap {
	badge: TBadges;
	beverage: TBeverages;
	clothes: TClothes;
	cooker: TCookers;
	currency_item: TCurrencyItems;
	decoration: TDecorations;
	food: TFoods;
	ingredient: TIngredients;
	item: TGeneralItems;
	normal_guest: TNormalGuests;
	partner: TPartners;
	record: TRecords;
	special_guest: TSpecialGuests;
	trophy: TFishingCollectibles;
}

interface ISpriteIdMap {
	badge: TBadgeId;
	beverage: TBeverageId;
	clothes: TClothesId;
	cooker: TCookerId;
	currency_item: TCurrencyItemId;
	decoration: TDecorationId;
	food: TFoodId;
	ingredient: TIngredientId;
	item: TGeneralItemId;
	normal_guest: TNormalGuestId;
	partner: TPartnerId;
	record: TRecordId;
	special_guest: TSpecialGuestId;
	trophy: TFishingCollectibleId;
}

export type TSpriteData<T extends TSpriteTarget = TSpriteTarget> =
	ISpriteDataMap[T];

export type TSpriteId<T extends TSpriteTarget = TSpriteTarget> =
	ISpriteIdMap[T];

export type TSpriteRecordIdentity<T extends TSpriteTarget = TSpriteTarget> = {
	[TTarget in T]: { recordId: TSpriteId<TTarget>; spriteTarget: TTarget };
}[T];

export interface ISpriteConfig {
	col: number;
	row: number;
	size: { height: number; width: number };
}
