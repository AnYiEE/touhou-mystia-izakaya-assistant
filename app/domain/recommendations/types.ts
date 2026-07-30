import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealRecipe } from '@/domain/meals/types';
import type { ICustomerOrder } from '@/domain/orders/types';
import type { IPopularTrend } from '@/domain/trends/types';

export interface ISuggestedMeal {
	beverage: TBeverageName;
	price: number;
	rating: TRatingKey;
	recipe: IMealRecipe;
}

export interface ISuggestParams {
	readonly cooker: TCookerName | null;
	readonly currentBeverage: TBeverageName | null;
	readonly currentRecipe: IMealRecipe | null;
	readonly customerName: TCustomerRareName;
	readonly customerOrder: ICustomerOrder;
	readonly hasMystiaCooker: boolean;
	readonly hiddenBeverages: ReadonlySet<TBeverageName>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenIngredients: ReadonlySet<TIngredientName>;
	readonly hiddenRecipes: ReadonlySet<TRecipeName>;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
}

export interface ISuggestIngredientPenaltyContext {
	readonly ingredientEaseMap: ReadonlyMap<TIngredientName, number>;
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
