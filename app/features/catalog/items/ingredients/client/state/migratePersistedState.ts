import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import { INGREDIENT_TYPE_MAP } from '@/domain/data/ingredients/ingredientFacts';
import type { TIngredientTypeId } from '@/domain/data/ingredients/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

export const INGREDIENTS_STORE_VERSION = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	filterTypes: 2, // eslint-disable-next-line sort-keys
	filterPlaces: 3,
	removeSearchValue: 4, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 5,
	recordIdentity: 6,
} as const;

const storeVersion = INGREDIENTS_STORE_VERSION;
const LEGACY_INGREDIENT_TYPE_MAP = new Map<string, TIngredientTypeId>(
	Object.entries(INGREDIENT_TYPE_MAP).map(([type, label]) => [
		label,
		Number(type) as TIngredientTypeId,
	])
);

export function migrateIngredientsPersistedState<T>(
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
	if (version < storeVersion.filterTypes) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { filters },
		} = oldState;
		filters.types = [];
		filters.noTypes = [];
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
		filters.noPlaces = filters.noPlaces.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-ingredient-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noTags = filters.noTags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-ingredient-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noTypes = filters.noTypes.map(
			(label: string) => LEGACY_INGREDIENT_TYPE_MAP.get(label) ?? label
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.places = filters.places.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-ingredient-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.tags = filters.tags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-ingredient-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.types = filters.types.map(
			(label: string) => LEGACY_INGREDIENT_TYPE_MAP.get(label) ?? label
		);
	}
	return oldState as T;
}
