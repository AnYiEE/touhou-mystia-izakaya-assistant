import type { TBeverageName, TBeverages } from '@/domain/data/beverages/types';
import type { TClothes, TClothesName } from '@/domain/data/clothes/types';
import type { TCookerName, TCookers } from '@/domain/data/cookers/types';
import type {
	TCurrencies,
	TCurrencyName,
} from '@/domain/data/currencies/types';
import type {
	TCustomerNormalName,
	TCustomerNormals,
} from '@/domain/data/customers/normal/types';
import type {
	TCustomerRareName,
	TCustomerRares,
} from '@/domain/data/customers/rare/types';
import type {
	TIngredientName,
	TIngredients,
} from '@/domain/data/ingredients/types';
import type { TOrnamentName, TOrnaments } from '@/domain/data/ornaments/types';
import type { TPartnerName, TPartners } from '@/domain/data/partners/types';
import type { TRecipeName, TRecipes } from '@/domain/data/recipes/types';

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

export type TSpriteData<T extends TSpriteTarget = TSpriteTarget> =
	T extends 'beverage'
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
											: never;

export type TSpriteName<T extends TSpriteTarget = TSpriteTarget> =
	T extends 'beverage'
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
											: never;

export interface ISpriteConfig {
	col: number;
	row: number;
	size: { height: number; width: number };
}
