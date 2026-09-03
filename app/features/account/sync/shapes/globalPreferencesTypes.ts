import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';
import type { IPopularTrend } from '@/domain/trends/types';

import type {
	TBeverageTableColumnKey,
	TFoodTableColumnKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';

export interface TGlobalPreferencesSnapshot {
	donationModal: {
		interactionCount: number;
		lastMilestoneShown: number;
		lastShown: number | null;
	};
	famousShop: boolean;
	guestCardTagsTooltip: boolean;
	hiddenItems: { dlcs: string[] };
	highAppearance: boolean;
	popularTrend: IPopularTrend;
	suggestMeals: {
		enabled: boolean;
		maxExtraIngredients: number | null;
		maxRating: number;
		maxResults: number;
		sortProfile: TRecommendationSortProfile;
	};
	table: {
		columns: {
			beverage: TBeverageTableColumnKey[];
			recipe: TFoodTableColumnKey[];
		};
		hiddenItems: {
			beverages: TBeverageId[];
			foods: TFoodId[];
			ingredients: TIngredientId[];
		};
		row: number;
	};
	tachie: boolean;
	vibrate: boolean;
}

export interface IGlobalPreferencesSetValueOrders {
	beverageColumns: ReadonlyArray<string>;
	foodColumns: ReadonlyArray<string>;
	hiddenBeverages: ReadonlyArray<TBeverageId>;
	hiddenDlcs: ReadonlyArray<string>;
	hiddenFoods: ReadonlyArray<TFoodId>;
	hiddenIngredients: ReadonlyArray<TIngredientId>;
}
