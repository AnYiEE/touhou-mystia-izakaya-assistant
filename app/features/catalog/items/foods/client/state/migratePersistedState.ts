import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { resolveLegacyCookerType } from '@/domain/catalog/legacy/resolveLegacyCookerType';
import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import { FOOD_COLLABORATION_SOURCE_FILTER } from '@/features/catalog/items/foods/sourceFilter';

export const FOODS_STORE_VERSION = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	cooker: 2,
	filterPlaces: 3,
	removeSearchValue: 4, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 5,
	recordIdentity: 6,
} as const;

const storeVersion = FOODS_STORE_VERSION;

export function migrateFoodsPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= storeVersion.recordIdentity) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < storeVersion.popular) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence = oldState.page;
		delete oldState.page;
	}
	if (version < storeVersion.cooker) {
		// cSpell:ignore kitchenwares
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.filters.cookers =
			oldState.persistence.filters.kitchenwares;
		delete oldState.persistence.filters.kitchenwares;
	}
	if (version < storeVersion.filterPlaces) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { filters },
		} = oldState;
		filters.places = [];
		filters.noPlaces = [];
	}
	if (version < storeVersion.removeSearchValue) {
		delete oldState.persistence.searchValue;
	}
	if (version < storeVersion.availabilityDlcFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.filters.contentDlcs =
			oldState.persistence.filters.dlcs;
		oldState.persistence.filters.availabilityDlcs = [];
		delete oldState.persistence.filters.dlcs;
	}
	if (version < storeVersion.recordIdentity) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filters } = oldState.persistence;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.cookerTypes = filters.cookers.map((label: string) =>
			resolveLegacyCookerType(label)
		);
		const ingredientCatalog = IngredientCatalog.getInstance();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.ingredients = filters.ingredients.map((name: TIngredientName) =>
			resolveLegacyRecordName({
				catalog: ingredientCatalog,
				category: 'ingredient',
				name,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.negativeTags = filters.negativeTags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-food-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noIngredients = filters.noIngredients.map(
			(name: TIngredientName) =>
				resolveLegacyRecordName({
					catalog: ingredientCatalog,
					category: 'ingredient',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noNegativeTags = filters.noNegativeTags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-food-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noPlaces = filters.noPlaces.map((label: string) =>
			label === FOOD_COLLABORATION_SOURCE_FILTER
				? label
				: resolveLegacyMapLabel({
						errorCode: 'invalid-legacy-food-filter-source',
						label,
					})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noPositiveTags = filters.noPositiveTags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-food-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.places = filters.places.map((label: string) =>
			label === FOOD_COLLABORATION_SOURCE_FILTER
				? label
				: resolveLegacyMapLabel({
						errorCode: 'invalid-legacy-food-filter-source',
						label,
					})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.positiveTags = filters.positiveTags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-food-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		delete filters.cookers;
	}
	return oldState as T;
}
