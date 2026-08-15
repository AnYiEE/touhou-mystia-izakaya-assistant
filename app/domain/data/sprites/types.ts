import type { TBeverageId, TBeverages } from '@/domain/data/beverages/types';
import type { TClothes, TClothesId } from '@/domain/data/clothes/types';
import type { TCookerId, TCookers } from '@/domain/data/cookers/types';
import type {
	TCurrencyItemId,
	TCurrencyItems,
} from '@/domain/data/currencyItems/types';
import type {
	TDecorationId,
	TDecorations,
} from '@/domain/data/decorations/types';
import type { TFoodId, TFoods } from '@/domain/data/foods/types';
import type {
	TNormalGuestId,
	TNormalGuests,
} from '@/domain/data/guests/normal/types';
import type {
	TSpecialGuestId,
	TSpecialGuests,
} from '@/domain/data/guests/special/types';
import type {
	TIngredientId,
	TIngredients,
} from '@/domain/data/ingredients/types';
import type { TPartnerId, TPartners } from '@/domain/data/partners/types';

export type TSpriteTarget =
	| 'beverage'
	| 'clothes'
	| 'cooker'
	| 'currency_item'
	| 'decoration'
	| 'food'
	| 'ingredient'
	| 'normal_guest'
	| 'partner'
	| 'special_guest';

export type TSpriteData<T extends TSpriteTarget = TSpriteTarget> =
	T extends 'beverage'
		? TBeverages
		: T extends 'clothes'
			? TClothes
			: T extends 'cooker'
				? TCookers
				: T extends 'currency_item'
					? TCurrencyItems
					: T extends 'decoration'
						? TDecorations
						: T extends 'food'
							? TFoods
							: T extends 'ingredient'
								? TIngredients
								: T extends 'normal_guest'
									? TNormalGuests
									: T extends 'partner'
										? TPartners
										: T extends 'special_guest'
											? TSpecialGuests
											: never;

export type TSpriteId<T extends TSpriteTarget = TSpriteTarget> =
	T extends 'beverage'
		? TBeverageId
		: T extends 'clothes'
			? TClothesId
			: T extends 'cooker'
				? TCookerId
				: T extends 'currency_item'
					? TCurrencyItemId
					: T extends 'decoration'
						? TDecorationId
						: T extends 'food'
							? TFoodId
							: T extends 'ingredient'
								? TIngredientId
								: T extends 'normal_guest'
									? TNormalGuestId
									: T extends 'partner'
										? TPartnerId
										: T extends 'special_guest'
											? TSpecialGuestId
											: never;

export type TSpriteRecordIdentity<T extends TSpriteTarget = TSpriteTarget> = {
	[TTarget in T]: { recordId: TSpriteId<TTarget>; spriteTarget: TTarget };
}[T];

export interface ISpriteConfig {
	col: number;
	row: number;
	size: { height: number; width: number };
}
