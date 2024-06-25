import {
	type TBeverages,
	type TBeverageNames,
	type TCustomerNormals,
	type TCustomerNormalNames,
	type TCustomerRares,
	type TCustomerRareNames,
	type TCustomerSpecials,
	type TCustomerSpecialNames,
	type TIngredients,
	type TIngredientNames,
	type TKitchenwares,
	type TKitchenwareNames,
	type TRecipes,
	type TRecipeNames,
} from '@/data';

export type TSpriteTarget =
	| 'beverage'
	| 'customer_normal'
	| 'customer_rare'
	| 'customer_special'
	| 'ingredient'
	| 'kitchenware'
	| 'recipe';

export type TSpriteData<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverages
	: T extends 'customer_normal'
		? TCustomerNormals
		: T extends 'customer_rare'
			? TCustomerRares
			: T extends 'customer_special'
				? TCustomerSpecials
				: T extends 'ingredient'
					? TIngredients
					: T extends 'kitchenware'
						? TKitchenwares
						: T extends 'recipe'
							? TRecipes
							:
									| TBeverages
									| TCustomerNormals
									| TCustomerRares
									| TCustomerSpecials
									| TIngredients
									| TKitchenwares
									| TRecipes;

export type TSpriteNames<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageNames
	: T extends 'customer_normal'
		? TCustomerNormalNames
		: T extends 'customer_rare'
			? TCustomerRareNames
			: T extends 'customer_special'
				? TCustomerSpecialNames
				: T extends 'ingredient'
					? TIngredientNames
					: T extends 'kitchenware'
						? TKitchenwareNames
						: T extends 'recipe'
							? TRecipeNames
							:
									| TBeverageNames
									| TCustomerNormalNames
									| TCustomerRareNames
									| TCustomerSpecialNames
									| TIngredientNames
									| TKitchenwareNames
									| TRecipeNames;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
