import type { TBadgeName, TBadges } from './badges/types';
import type { TBeverageName, TBeverages } from './beverages/types';
import type { TClothes, TClothesName } from './clothes/types';
import type { TCookerName, TCookers } from './cookers/types';
import type { TCurrencyItemName, TCurrencyItems } from './currencyItems/types';
import type { TDecorationName, TDecorations } from './decorations/types';
import type { TFoodName, TFoods } from './foods/types';
import type {
	TFishingCollectibleName,
	TFishingCollectibles,
} from './fishingCollectibles/types';
import type { TGeneralItemName, TGeneralItems } from './generalItems/types';
import type { TNormalGuestName, TNormalGuests } from './guests/normal/types';
import type { TSpecialGuestName, TSpecialGuests } from './guests/special/types';
import type { TIngredientName, TIngredients } from './ingredients/types';
import type { TPartnerName, TPartners } from './partners/types';
import type { TRecordName, TRecords } from './records/types';

export type TGuests = TNormalGuests | TSpecialGuests;
export type TTaggedRecords = TBeverages | TFoods | TIngredients;
export type TItems =
	| TBadges
	| TGuests
	| TTaggedRecords
	| TClothes
	| TCookers
	| TCurrencyItems
	| TDecorations
	| TFishingCollectibles
	| TGeneralItems
	| TPartners
	| TRecords;

export type TGuestName = TNormalGuestName | TSpecialGuestName;
export type TTaggedRecordName = TBeverageName | TFoodName | TIngredientName;
export type TItemName =
	| TBadgeName
	| TGuestName
	| TTaggedRecordName
	| TClothesName
	| TCookerName
	| TCurrencyItemName
	| TDecorationName
	| TFishingCollectibleName
	| TGeneralItemName
	| TPartnerName
	| TRecordName;
