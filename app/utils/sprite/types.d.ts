import {
	type TBeverageName,
	type TBeverages,
	type TClothes,
	type TClothesName,
	type TCookerName,
	type TCookers,
	type TCurrencies,
	type TCurrencyName,
	type TCustomerNormalName,
	type TCustomerNormals,
	type TCustomerRareName,
	type TCustomerRares,
	type TIngredientName,
	type TIngredients,
	type TOrnamentName,
	type TOrnaments,
	type TPartnerName,
	type TPartners,
	type TRecipeName,
	type TRecipes,
} from '@/data';

export type TSpriteTarget =
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'currency'
	| 'customer_normal'
	| 'customer_rare'
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
												| TIngredients
												| TOrnaments
												| TPartners
												| TRecipes;

export type TSpriteName<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageName
	: T extends 'clothes'
		? TClothesName
		: T extends 'cooker'
			? TCookerName
			: T extends 'currency'
				? TCurrencyName
				: T extends 'customer_normal'
					? TCustomerNormalName
					: T extends 'customer_rare'
						? TCustomerRareName
						: T extends 'ingredient'
							? TIngredientName
							: T extends 'ornament'
								? TOrnamentName
								: T extends 'partner'
									? TPartnerName
									: T extends 'recipe'
										? TRecipeName
										:
												| TBeverageName
												| TClothesName
												| TCookerName
												| TCurrencyName
												| TCustomerNormalName
												| TCustomerRareName
												| TIngredientName
												| TOrnamentName
												| TPartnerName
												| TRecipeName;

export interface ISpriteConfig {
	col: number;
	row: number;
	scale: number;
	size: { height: number; width: number };
}
