export * from './beverages';
export * from './customer_normal';
export * from './customer_rare';
export * from './customer_special';
export * from './ingredients';
export * from './kitchenwares';
export * from './recipes';

export type {TBeverages, TBeverageNames, IBeverage} from './beverages/types';
export type {TCustomerNormals, TCustomerNormalNames, ICustomerNormal} from './customer_normal/types';
export type {TCustomerRares, TCustomerRareNames, ICustomerRare} from './customer_rare/types';
export type {TCustomerSpecials, TCustomerSpecialNames, ICustomerSpecial} from './customer_special/types';
export type {TIngredients, TIngredientNames, IIngredient} from './ingredients/types';
export type {TKitchenwares, TKitchenwareNames, IKitchenware} from './kitchenwares/types';
export type {TRecipes, TRecipeNames, IRecipe} from './recipes/types';

export type TCustomer =
	| import('./customer_normal/types').TCustomerNormals
	| import('./customer_rare/types').TCustomerRares
	| import('./customer_special/types').TCustomerSpecials;

export type TFood =
	| import('./beverages/types').TBeverages
	| import('./ingredients/types').TIngredients
	| import('./recipes/types').TRecipes;

export type TItems = TCustomer | TFood | import('./kitchenwares/types').TKitchenwares;

export type TCustomerNames =
	| import('./customer_normal/types').TCustomerNormalNames
	| import('./customer_rare/types').TCustomerRareNames
	| import('./customer_special/types').TCustomerSpecialNames;

export type TFoodNames =
	| import('./beverages/types').TBeverageNames
	| import('./ingredients/types').TIngredientNames
	| import('./recipes/types').TRecipeNames;

export type TItemNames = TCustomerNames | TFoodNames | import('./kitchenwares/types').TKitchenwareNames;
export type TTags = import('./types').TBeverageTag | import('./types').TRecipeTag;
