import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	type TBeverageTableColumnKey,
	type TRecipeTableColumnKey,
} from '@/features/catalog/customers/shared/state/tableDescriptors';

import { globalStore } from './globalPersistenceStore';

export interface IGlobalPreferencesPersistenceSource {
	customerCardTagsTooltip: unknown;
	donationModal: unknown;
	famousShop: unknown;
	hiddenItems: unknown;
	highAppearance: unknown;
	popularTrend: unknown;
	suggestMeals: unknown;
	table: unknown;
	tachie: unknown;
	vibrate: unknown;
}

export interface IGlobalPreferencesPersistenceSnapshot {
	customerCardTagsTooltip: boolean;
	donationModal: {
		interactionCount: number;
		lastMilestoneShown: number;
		lastShown: number | null;
	};
	famousShop: boolean;
	hiddenItems: { dlcs: string[] };
	highAppearance: boolean;
	popularTrend: IPopularTrend;
	suggestMeals: {
		enabled: boolean;
		maxExtraIngredients: number | null;
		maxRating: number;
		maxResults: number;
	};
	table: {
		columns: {
			beverage: TBeverageTableColumnKey[];
			recipe: TRecipeTableColumnKey[];
		};
		hiddenItems: {
			beverages: TBeverageName[];
			ingredients: TIngredientName[];
			recipes: TRecipeName[];
		};
		row: number;
	};
	tachie: boolean;
	vibrate: boolean;
}

export function readGlobalPreferencesPersistenceSource(): IGlobalPreferencesPersistenceSource {
	const persistence = globalStore.persistence.get();

	return {
		customerCardTagsTooltip: persistence.customerCardTagsTooltip,
		donationModal: persistence.donationModal,
		famousShop: persistence.famousShop,
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
		customerCardTagsTooltip: snapshot.customerCardTagsTooltip,
		donationModal: snapshot.donationModal,
		famousShop: snapshot.famousShop,
		hiddenItems: snapshot.hiddenItems,
		highAppearance: snapshot.highAppearance,
		popularTrend: snapshot.popularTrend,
		suggestMeals: snapshot.suggestMeals,
		table: snapshot.table,
		tachie: snapshot.tachie,
		vibrate: snapshot.vibrate,
	});
}
