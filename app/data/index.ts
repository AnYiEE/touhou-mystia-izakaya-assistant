export * from './constant';

export * from './beverages';
export * from './clothes';
export * from './cookers';
export * from './currencies';
export * from './customer_normal';
export * from './customer_rare';
export * from './ingredients';
export * from './ornaments';
export * from './partners';
export * from './recipes';

export type {TBeverages, TBeverageName, IBeverage} from './beverages/types';
export type {TClothes, TClothesName, IClothes} from './clothes/types';
export type {TCookers, TCookerCategory, TCookerName, TCookerType, ICooker} from './cookers/types';
export type {TCurrencies, TCurrencyName, ICurrency} from './currencies/types';
export type {TCustomerNormals, TCustomerNormalName, ICustomerNormal} from './customer_normal/types';
export type {TCustomerRares, TCustomerRareName, ICustomerRare} from './customer_rare/types';
export type {TIngredients, TIngredientName, TIngredientType, IIngredient} from './ingredients/types';
export type {TOrnaments, TOrnamentName, IOrnament} from './ornaments/types';
export type {TPartners, TPartnerName, IPartner} from './partners/types';
export type {TRecipes, TRecipeName, IRecipe} from './recipes/types';

export type TCustomers =
	| import('./customer_normal/types').TCustomerNormals
	| import('./customer_rare/types').TCustomerRares;

export type TFoods =
	| import('./beverages/types').TBeverages
	| import('./ingredients/types').TIngredients
	| import('./recipes/types').TRecipes;

export type TItems =
	| TCustomers
	| TFoods
	| import('./clothes/types').TClothes
	| import('./cookers/types').TCookers
	| import('./currencies/types').TCurrencies
	| import('./ornaments/types').TOrnaments
	| import('./partners/types').TPartners;

export type TCustomerName =
	| import('./customer_normal/types').TCustomerNormalName
	| import('./customer_rare/types').TCustomerRareName;

export type TFoodName =
	| import('./beverages/types').TBeverageName
	| import('./ingredients/types').TIngredientName
	| import('./recipes/types').TRecipeName;

export type TItemName =
	| TCustomerName
	| TFoodName
	| import('./clothes/types').TClothesName
	| import('./cookers/types').TCookerName
	| import('./currencies/types').TCurrencyName
	| import('./ornaments/types').TOrnamentName
	| import('./partners/types').TPartnerName;

export type TBeverageTag = import('./types').TBeverageTag;
export type TIngredientTag = import('./types').TIngredientTag;
export type TRecipeTag = import('./types').TRecipeTag;
export type TTag = TBeverageTag | TIngredientTag | TRecipeTag;

export type TEvaluation = import('./types').TEvaluation;
export type TEvaluationKey = import('./types').TEvaluationKey;
export type TEvaluationKeyMap = import('./types').TEvaluationKeyMap;
export type TEvaluationMap = import('./types').TEvaluationMap;
export type TRating = import('./types').TRating;
export type TRatingKey = import('./types').TRatingKey;
export type TRatingKeyMap = import('./types').TRatingKeyMap;
export type TRatingMap = import('./types').TRatingMap;

export type TDlc = import('./types').TDlc;
export type TLevel = import('./types').TLevel;
export type TPlace = import('./types').TPlace;
export type TRewardType = import('./types').TRewardType;
export type TSpeed = import('./types').TSpeed;
