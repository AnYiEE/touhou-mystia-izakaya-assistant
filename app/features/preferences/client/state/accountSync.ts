import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	type TBeverageTableColumnKey,
	type TFoodTableColumnKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';

import { globalStore } from './globalPersistenceStore';

export interface IGlobalPreferencesPersistenceSource {
	donationModal: unknown;
	famousShop: unknown;
	guestCardTagsTooltip: unknown;
	hiddenItems: unknown;
	highAppearance: unknown;
	popularTrend: unknown;
	suggestMeals: unknown;
	table: unknown;
	tachie: unknown;
	vibrate: unknown;
}

export interface IGlobalPreferencesPersistenceSnapshot {
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

export function readGlobalPreferencesPersistenceSource(): IGlobalPreferencesPersistenceSource {
	const persistence = globalStore.persistence.get();

	return {
		donationModal: persistence.donationModal,
		famousShop: persistence.famousShop,
		guestCardTagsTooltip: persistence.guestCardTagsTooltip,
		hiddenItems: persistence.hiddenItems,
		highAppearance: persistence.highAppearance,
		popularTrend: persistence.popularTrend,
		suggestMeals: persistence.suggestMeals,
		table: persistence.table,
		tachie: persistence.tachie,
		vibrate: persistence.vibrate,
	};
}

export function replaceGlobalPreferencesPersistenceSnapshot(
	snapshot: IGlobalPreferencesPersistenceSnapshot
): void {
	globalStore.persistence.assign({
		donationModal: snapshot.donationModal,
		famousShop: snapshot.famousShop,
		guestCardTagsTooltip: snapshot.guestCardTagsTooltip,
		hiddenItems: snapshot.hiddenItems,
		highAppearance: snapshot.highAppearance,
		popularTrend: snapshot.popularTrend,
		suggestMeals: snapshot.suggestMeals,
		table: snapshot.table,
		tachie: snapshot.tachie,
		vibrate: snapshot.vibrate,
	});
}
