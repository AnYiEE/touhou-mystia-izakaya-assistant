import type { TBeverageName, TBeverages } from './beverages/types';
import type { TClothes, TClothesName } from './clothes/types';
import type { TCookerName, TCookers } from './cookers/types';
import type { TCurrencies, TCurrencyName } from './currencies/types';
import type {
	TCustomerNormalName,
	TCustomerNormals,
} from './customers/normal/types';
import type { TCustomerRareName, TCustomerRares } from './customers/rare/types';
import type { TIngredientName, TIngredients } from './ingredients/types';
import type { TOrnamentName, TOrnaments } from './ornaments/types';
import type { TPartnerName, TPartners } from './partners/types';
import type { TRecipeName, TRecipes } from './recipes/types';

export type TCustomers = TCustomerNormals | TCustomerRares;
export type TFoods = TBeverages | TIngredients | TRecipes;
export type TItems =
	| TCustomers
	| TFoods
	| TClothes
	| TCookers
	| TCurrencies
	| TOrnaments
	| TPartners;

export type TCustomerName = TCustomerNormalName | TCustomerRareName;
export type TFoodName = TBeverageName | TIngredientName | TRecipeName;
export type TItemName =
	| TCustomerName
	| TFoodName
	| TClothesName
	| TCookerName
	| TCurrencyName
	| TOrnamentName
	| TPartnerName;
