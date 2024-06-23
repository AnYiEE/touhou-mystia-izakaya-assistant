export * from './beverages';
export * from './customer_normal';
export * from './customer_rare';
export * from './customer_special';
export * from './ingredients';
export * from './kitchenwares';
export * from './recipes';

export type {Beverages, BeverageNames, IBeverage} from './beverages/types';
export type {CustomerNormals, CustomerNormalNames, ICustomerNormal} from './customer_normal/types';
export type {CustomerRares, CustomerRareNames, ICustomerRare} from './customer_rare/types';
export type {CustomerSpecials, CustomerSpecialNames, ICustomerSpecial} from './customer_special/types';
export type {Ingredients, IngredientNames, IIngredient} from './ingredients/types';
export type {Kitchenwares, KitchenwareNames, IKitchenware} from './kitchenwares/types';
export type {Recipes, RecipeNames, IRecipe} from './recipes/types';

export type Customer =
	| import('./customer_normal/types').CustomerNormals
	| import('./customer_rare/types').CustomerRares
	| import('./customer_special/types').CustomerSpecials;

export type Food =
	| import('./beverages/types').Beverages
	| import('./ingredients/types').Ingredients
	| import('./recipes/types').Recipes;

export type Items = Customer | Food | import('./kitchenwares/types').Kitchenwares;

export type CustomerNames =
	| import('./customer_normal/types').CustomerNormalNames
	| import('./customer_rare/types').CustomerRareNames
	| import('./customer_special/types').CustomerSpecialNames;

export type FoodNames =
	| import('./beverages/types').BeverageNames
	| import('./ingredients/types').IngredientNames
	| import('./recipes/types').RecipeNames;

export type ItemNames = CustomerNames | FoodNames | import('./kitchenwares/types').KitchenwareNames;
export type Tags = import('./types').BeverageTag | import('./types').RecipeTag;
