import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';
import type { IPopularTrend } from '@/domain/trends/types';

export interface ISuggestedMeal {
	beverage: TBeverageId;
	food: IMealFood;
	price: number;
	rating: TRatingKey;
}

export interface ISuggestParams {
	readonly cooker: TCookerId | null;
	readonly currentBeverage: TBeverageId | null;
	readonly currentFood: IMealFood | null;
	readonly guestOrder: IGuestOrder;
	readonly hasMystiaCooker: boolean;
	readonly hiddenBeverages: ReadonlySet<TBeverageId>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenFoods: ReadonlySet<TFoodId>;
	readonly hiddenIngredients: ReadonlySet<TIngredientId>;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
	readonly specialGuest: TSpecialGuestId;
}

export interface ISuggestIngredientPenaltyContext {
	readonly ingredientEaseMap: ReadonlyMap<TIngredientId, number>;
	readonly maxIngredientEase: number;
	readonly maxIngredientLevel: number;
	readonly maxIngredientPrice: number;
	readonly minIngredientLevel: number;
	readonly minIngredientPrice: number;
}

export interface ISuggestIngredientResourcePenalty {
	readonly acquisition: number;
	readonly level: number;
	readonly price: number;
	readonly total: number;
}
