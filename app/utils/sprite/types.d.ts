import {
	type TBeverageNames,
	type TBeverages,
	type TClothes,
	type TClothesNames,
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
	type TOrnamentNames,
	type TOrnaments,
	type TRecipeNames,
	type TRecipes,
} from '@/data';

export type TSpriteTarget =
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'customer_normal'
	| 'customer_rare'
	| 'customer_special'
	| 'ingredient'
	| 'ornament'
	| 'recipe';

export type TSpriteData<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverages
	: T extends 'clothes'
		? TClothes
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
							: T extends 'ornament'
								? TOrnaments
								: T extends 'recipe'
									? TRecipes
									:
											| TBeverages
											| TClothes
											| TCookers
											| TCustomerNormals
											| TCustomerRares
											| TCustomerSpecials
											| TIngredients
											| TOrnaments
											| TRecipes;

export type TSpriteNames<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageNames
	: T extends 'clothes'
		? TClothesNames
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
							: T extends 'ornament'
								? TOrnamentNames
								: T extends 'recipe'
									? TRecipeNames
									:
											| TBeverageNames
											| TClothesNames
											| TCookerNames
											| TCustomerNormalNames
											| TCustomerRareNames
											| TCustomerSpecialNames
											| TIngredientNames
											| TOrnamentNames
											| TRecipeNames;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
