import {
	type TBeverageNames,
	type TBeverages,
	type TCookerNames,
	type TCookers,
	type TCustomerNormalNames,
	type TCustomerNormals,
	type TCustomerRareNames,
	type TCustomerRares,
	type TCustomerSpecialNames,
	type TCustomerSpecials,
	type TIngredientNames,
	type TIngredients,
	type TRecipeNames,
	type TRecipes,
} from '@/data';

export type TSpriteTarget =
	| 'beverage'
	| 'cooker'
	| 'customer_normal'
	| 'customer_rare'
	| 'customer_special'
	| 'ingredient'
	| 'recipe';

export type TSpriteData<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverages
	: T extends 'cooker'
		? TCookers
		: T extends 'customer_normal'
			? TCustomerNormals
			: T extends 'customer_rare'
				? TCustomerRares
				: T extends 'customer_special'
					? TCustomerSpecials
					: T extends 'ingredient'
						? TIngredients
						: T extends 'recipe'
							? TRecipes
							:
									| TBeverages
									| TCookers
									| TCustomerNormals
									| TCustomerRares
									| TCustomerSpecials
									| TIngredients
									| TRecipes;

export type TSpriteNames<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageNames
	: T extends 'cooker'
		? TCookerNames
		: T extends 'customer_normal'
			? TCustomerNormalNames
			: T extends 'customer_rare'
				? TCustomerRareNames
				: T extends 'customer_special'
					? TCustomerSpecialNames
					: T extends 'ingredient'
						? TIngredientNames
						: T extends 'recipe'
							? TRecipeNames
							:
									| TBeverageNames
									| TCookerNames
									| TCustomerNormalNames
									| TCustomerRareNames
									| TCustomerSpecialNames
									| TIngredientNames
									| TRecipeNames;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
