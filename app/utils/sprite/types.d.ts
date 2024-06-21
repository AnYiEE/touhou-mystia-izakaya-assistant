import {
	type Beverages,
	type BeverageNames,
	type CustomerNormals,
	type CustomerNormalNames,
	type CustomerRares,
	type CustomerRareNames,
	type CustomerSpecials,
	type CustomerSpecialNames,
	type Ingredients,
	type IngredientNames,
	type Kitchenwares,
	type KitchenwareNames,
	type Recipes,
	type RecipeNames,
} from '@/data';

export type SpriteTarget =
	| 'beverage'
	| 'customer_normal'
	| 'customer_rare'
	| 'customer_special'
	| 'ingredient'
	| 'kitchenware'
	| 'recipe';

export type SpriteData<T extends SpriteTarget = string> = T extends 'beverage'
	? Beverages
	: T extends 'customer_normal'
		? CustomerNormals
		: T extends 'customer_rare'
			? CustomerRares
			: T extends 'customer_special'
				? CustomerSpecials
				: T extends 'ingredient'
					? Ingredients
					: T extends 'kitchenware'
						? Kitchenwares
						: T extends 'recipe'
							? Recipes
							:
									| Beverages
									| CustomerNormals
									| CustomerRares
									| CustomerSpecials
									| Ingredients
									| Kitchenwares
									| Recipes;

export type SpriteNames<T extends SpriteTarget = string> = T extends 'beverage'
	? BeverageNames
	: T extends 'customer_normal'
		? CustomerNormalNames
		: T extends 'customer_rare'
			? CustomerRareNames
			: T extends 'customer_special'
				? CustomerSpecialNames
				: T extends 'ingredient'
					? IngredientNames
					: T extends 'kitchenware'
						? KitchenwareNames
						: T extends 'recipe'
							? RecipeNames
							:
									| BeverageNames
									| CustomerNormalNames
									| CustomerRareNames
									| CustomerSpecialNames
									| IngredientNames
									| KitchenwareNames
									| RecipeNames;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
