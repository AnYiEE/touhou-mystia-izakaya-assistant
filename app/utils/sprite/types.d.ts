import {
	type TBeverageId,
	type TBeverages,
	type TClothes,
	type TClothesId,
	type TCookerId,
	type TCookers,
	type TCurrencies,
	type TCurrencyId,
	type TCustomerNormalId,
	type TCustomerNormals,
	type TCustomerRareId,
	type TCustomerRares,
	type TIngredientId,
	type TIngredients,
	type TOrnamentId,
	type TOrnaments,
	type TPartnerId,
	type TPartners,
	type TRecipeId,
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

export type TSpriteId<T extends TSpriteTarget = string> = T extends 'beverage'
	? TBeverageId
	: T extends 'clothes'
		? TClothesId
		: T extends 'cooker'
			? TCookerId
			: T extends 'currency'
				? TCurrencyId
				: T extends 'customer_normal'
					? TCustomerNormalId
					: T extends 'customer_rare'
						? TCustomerRareId
						: T extends 'ingredient'
							? TIngredientId
							: T extends 'ornament'
								? TOrnamentId
								: T extends 'partner'
									? TPartnerId
									: T extends 'recipe'
										? TRecipeId
										:
												| TBeverageId
												| TClothesId
												| TCookerId
												| TCurrencyId
												| TCustomerNormalId
												| TCustomerRareId
												| TIngredientId
												| TOrnamentId
												| TPartnerId
												| TRecipeId;

export interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}
