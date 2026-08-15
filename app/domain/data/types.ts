import type { TBeverageName, TBeverages } from './beverages/types';
import type { TClothes, TClothesName } from './clothes/types';
import type { TCookerName, TCookers } from './cookers/types';
import type { TCurrencyItemName, TCurrencyItems } from './currencyItems/types';
import type { TDecorationName, TDecorations } from './decorations/types';
import type { TFoodName, TFoods } from './foods/types';
import type { TNormalGuestName, TNormalGuests } from './guests/normal/types';
import type { TSpecialGuestName, TSpecialGuests } from './guests/special/types';
import type { TIngredientName, TIngredients } from './ingredients/types';
import type { TPartnerName, TPartners } from './partners/types';

export type TGuests = TNormalGuests | TSpecialGuests;
export type TTaggedRecords = TBeverages | TFoods | TIngredients;
export type TItems =
	| TGuests
	| TTaggedRecords
	| TClothes
	| TCookers
	| TCurrencyItems
	| TDecorations
	| TPartners;

export type TGuestName = TNormalGuestName | TSpecialGuestName;
export type TTaggedRecordName = TBeverageName | TFoodName | TIngredientName;
export type TItemName =
	| TGuestName
	| TTaggedRecordName
	| TClothesName
	| TCookerName
	| TCurrencyItemName
	| TDecorationName
	| TPartnerName;
