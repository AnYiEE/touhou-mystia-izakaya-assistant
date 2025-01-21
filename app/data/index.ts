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

export type {TBeverages, TBeverageId, TBeverageName, IBeverage} from './beverages/types';
export type {TClothes, TClothesId, TClothesName, IClothes} from './clothes/types';
export type {TCookers, TCookerCategoryId, TCookerId, TCookerName, TCookerTypeId, ICooker} from './cookers/types';
export type {TCurrencies, TCurrencyId, TCurrencyName, ICurrency} from './currencies/types';
export type {TCustomerNormals, TCustomerNormalId, TCustomerNormalName, ICustomerNormal} from './customer_normal/types';
export type {TCustomerRares, TCustomerRareId, TCustomerRareName, ICustomerRare} from './customer_rare/types';
export type {TIngredients, TIngredientId, TIngredientName, TIngredientTypeId, IIngredient} from './ingredients/types';
export type {TOrnaments, TOrnamentId, TOrnamentName, IOrnament} from './ornaments/types';
export type {TPartners, TPartnerId, TPartnerName, IPartner} from './partners/types';
export type {TRecipes, TRecipeId, TRecipeName, IRecipe} from './recipes/types';

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

export type TCustomerId =
	| import('./customer_normal/types').TCustomerNormalId
	| import('./customer_rare/types').TCustomerRareId;

export type TCustomerName =
	| import('./customer_normal/types').TCustomerNormalName
	| import('./customer_rare/types').TCustomerRareName;

export type TFoodId =
	| import('./beverages/types').TBeverageId
	| import('./ingredients/types').TIngredientId
	| import('./recipes/types').TRecipeId;

export type TFoodName =
	| import('./beverages/types').TBeverageName
	| import('./ingredients/types').TIngredientName
	| import('./recipes/types').TRecipeName;

export type TItemId =
	| TCustomerId
	| TFoodId
	| import('./clothes/types').TClothesId
	| import('./cookers/types').TCookerId
	| import('./currencies/types').TCurrencyId
	| import('./ornaments/types').TOrnamentId
	| import('./partners/types').TPartnerId;

export type TItemName =
	| TCustomerName
	| TFoodName
	| import('./clothes/types').TClothesName
	| import('./cookers/types').TCookerName
	| import('./currencies/types').TCurrencyName
	| import('./ornaments/types').TOrnamentName
	| import('./partners/types').TPartnerName;

export type TBeverageTagId = import('./types').TBeverageTagId;
export type TIngredientTagId = import('./types').TIngredientTagId;
export type TRecipeTagId = import('./types').TRecipeTagId;
 
export type TTagId = TBeverageTagId | TIngredientTagId | TRecipeTagId;

export type TCollectionLocation = import('./types').TCollectionLocation;
export type TDlc = import('./types').TDlc;
export type TLevel = import('./types').TLevel;
export type TPlaceId = import('./types').TPlaceId;
export type TRewardType = import('./types').TRewardType;
export type TSpeedId = import('./types').TSpeedId;

export type TEvaluation = import('@/types').TEvaluation;
export type TEvaluationKey = import('@/types').TEvaluationKey;
export type TEvaluationKeyMap = import('@/types').TEvaluationKeyMap;
export type TEvaluationMap = import('@/types').TEvaluationMap;
export type TRating = import('@/types').TRating;
export type TRatingKey = import('@/types').TRatingKey;
export type TRatingKeyMap = import('@/types').TRatingKeyMap;
export type TRatingMap = import('@/types').TRatingMap;
