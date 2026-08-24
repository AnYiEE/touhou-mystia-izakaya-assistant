import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import {
	type TLegacyFoodName,
	resolveLegacyFoodName,
} from '@/domain/catalog/legacy/resolveLegacyFoodName';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

import { migrateLegacyFoodTableColumnKeys } from '@/features/catalog/guests/shared/state/migrateLegacyFoodTableKeys';
import {
	beverageTableColumns,
	foodTableColumns,
} from '@/features/catalog/guests/shared/state/tableDescriptors';

import { toGetItemWithKey } from '@/shared/utilities/objects/convertCollection';

export const GLOBAL_PERSISTENCE_STORE_VERSION = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
	tagsTooltip: 2,
	version: 3, // eslint-disable-next-line sort-keys
	backgroundImage: 4,
	tachie: 5,
	vibrate: 6, // eslint-disable-next-line sort-keys
	renameBg: 7, // eslint-disable-next-line sort-keys
	famousShop: 8,
	popularTrend: 9, // eslint-disable-next-line sort-keys
	cloud: 10,
	tableShare: 11,
	userId: 12, // eslint-disable-next-line sort-keys
	hiddenItems: 13, // eslint-disable-next-line sort-keys
	hiddenDlcs: 14, // eslint-disable-next-line sort-keys
	donationModal: 15,
	donationModalRmDismiss: 16,
	suggestMeals: 17,
	suggestMealsExtra: 18, // eslint-disable-next-line sort-keys
	recordIdentity: 19,
	suggestMealsSortProfile: 20,
} as const;

const storeVersion = GLOBAL_PERSISTENCE_STORE_VERSION;

export function migrateGlobalPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= storeVersion.suggestMealsSortProfile) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < storeVersion.dirver) {
		oldState.persistence.dirver = [];
	}
	if (version < storeVersion.tagsTooltip) {
		oldState.persistence.customerCardTagsTooltip = true;
	}
	if (version < storeVersion.version) {
		oldState.persistence.version = null;
	}
	if (version < storeVersion.backgroundImage) {
		oldState.persistence.backgroundImage = true;
	}
	if (version < storeVersion.tachie) {
		oldState.persistence.tachie = true;
	}
	if (version < storeVersion.vibrate) {
		oldState.persistence.vibrate = true;
	}
	if (version < storeVersion.renameBg) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		persistence.highAppearance = persistence.backgroundImage;
		delete persistence.backgroundImage;
	}
	if (version < storeVersion.famousShop) {
		oldState.persistence.famousShop = false;
	}
	if (version < storeVersion.popularTrend) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		persistence.popularTrend = persistence.popular;
		delete persistence.popular;
	}
	if (version < storeVersion.cloud) {
		oldState.persistence.cloudCode = null;
	}
	if (version < storeVersion.tableShare) {
		oldState.persistence.table = {
			columns: {
				beverage: beverageTableColumns.map(toGetItemWithKey('key')),
				recipe: foodTableColumns
					.filter(({ key }) => key !== 'time')
					.map(toGetItemWithKey('key')),
			},
			row: 8,
		};
	}
	if (version < storeVersion.userId) {
		oldState.persistence.userId = null;
	}
	if (version < storeVersion.hiddenItems) {
		oldState.persistence.table.hiddenItems = {
			beverages: [],
			ingredients: [],
			recipes: [],
		};
	}
	if (version < storeVersion.hiddenDlcs) {
		oldState.persistence.hiddenItems = { dlcs: [] };
	}
	if (version < storeVersion.donationModal) {
		oldState.persistence.donationModal = {
			interactionCount: 0,
			isDismiss: false,
			lastMilestoneShown: 0,
			lastShown: null,
		};
	}
	if (version < storeVersion.donationModalRmDismiss) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		delete persistence.donationModal.isDismiss;
	}
	if (version < storeVersion.suggestMeals) {
		oldState.persistence.suggestMeals = { enabled: true, maxResults: 5 };
	}
	if (version < storeVersion.suggestMealsExtra) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		persistence.suggestMeals.maxExtraIngredients = null;
		persistence.suggestMeals.maxRating = 4;
	}
	if (version < storeVersion.recordIdentity) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { customerCardTagsTooltip, popularTrend, table } = persistence;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { hiddenItems } = table;
		const beverageCatalog = BeverageCatalog.getInstance();
		const foodCatalog = FoodCatalog.getInstance();
		const ingredientCatalog = IngredientCatalog.getInstance();
		const popularTags = new Set([
			...ingredientCatalog
				.getValuesByProp('tags')
				.filter((tag) => !ingredientCatalog.blockedTags.has(tag)),
			...foodCatalog
				.getValuesByProp('positiveTags')
				.filter((tag) => !foodCatalog.blockedTags.has(tag)),
		]);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		hiddenItems.beverages = hiddenItems.beverages.map(
			(name: TBeverageName) =>
				resolveLegacyRecordName({
					catalog: beverageCatalog,
					category: 'beverage',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		hiddenItems.foods = hiddenItems.recipes.map((name: TLegacyFoodName) =>
			resolveLegacyFoodName(name)
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		hiddenItems.ingredients = hiddenItems.ingredients.map(
			(name: TIngredientName) =>
				resolveLegacyRecordName({
					catalog: ingredientCatalog,
					category: 'ingredient',
					name,
				})
		);
		delete hiddenItems.recipes;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { tag: popularTag } = popularTrend;
		if (popularTag !== null) {
			popularTrend.tag = resolveLegacyTagLabel({
				allowed: popularTags,
				errorCode: 'invalid-legacy-popular-tag',
				facts: FOOD_TAG_MAP,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				label: popularTag,
			});
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		persistence.guestCardTagsTooltip = customerCardTagsTooltip;
		delete persistence.customerCardTagsTooltip;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { columns } = table;
		columns.recipe = migrateLegacyFoodTableColumnKeys(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			columns.recipe
		);
	}
	if (version < storeVersion.suggestMealsSortProfile) {
		oldState.persistence.suggestMeals.maxResults = 10;
		oldState.persistence.suggestMeals.sortProfile = 'material-cost-first';
	}
	return oldState as T;
}
