import {
	type TBeverageNames,
	type TBeverages,
	type TClothes,
	type TClothesNames,
	type TCookerNames,
	type TCookers,
	type TCurrencies,
	type TCurrencyNames,
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
	type TPartnerNames,
	type TPartners,
	type TRecipeNames,
	type TRecipes,
} from '@/data';

export type TSpriteTarget =
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'currency'
	| 'customer_normal'
	| 'customer_rare'
	| 'customer_special'
	| 'ingredient'
	| 'ornament'
	| 'partner'
	| 'recipe';

export type TSpriteData<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverages
	: T extends 'clothes'
		? TClothes
		: T extends 'cooker'
			? TCookers
			: T extends 'currency'
				? TCurrencies
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
									: T extends 'partner'
										? TPartners
										: T extends 'recipe'
											? TRecipes
											:
													| TBeverages
													| TClothes
													| TCookers
													| TCurrencies
													| TCustomerNormals
													| TCustomerRares
													| TCustomerSpecials
													| TIngredients
													| TOrnaments
													| TPartners
													| TRecipes;

export type TSpriteNames<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageNames
	: T extends 'clothes'
		? TClothesNames
		: T extends 'cooker'
			? TCookerNames
			: T extends 'currency'
				? TCurrencyNames
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
									: T extends 'partner'
										? TPartnerNames
										: T extends 'recipe'
											? TRecipeNames
											:
													| TBeverageNames
													| TClothesNames
													| TCookerNames
													| TCurrencyNames
													| TCustomerNormalNames
													| TCustomerRareNames
													| TCustomerSpecialNames
													| TIngredientNames
													| TOrnamentNames
													| TPartnerNames
													| TRecipeNames;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
