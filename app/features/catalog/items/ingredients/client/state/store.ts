import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { compareIngredientTypes } from '@/domain/data/ingredients/ingredientFacts';
import type { TIngredientTypeId } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import { compareMapLabels } from '@/domain/places/localizedLabels';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	createCatalogPersistenceShape,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import { registerCatalogLocalizationRevisionMirror } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { compareFoodTagLabels } from '@/features/catalog/shared/client/localization/tagLabels';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	INGREDIENTS_STORE_VERSION,
	migrateIngredientsPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = IngredientCatalog.getInstance();

const getNames = createNamesCache(instance);

const persistenceShape = createCatalogPersistenceShape({
	allowedValues: {
		availabilityDlcs: toAllowedValueSet(
			instance.getValuesByProp('availabilityDlcs')
		),
		contentDlcs: toAllowedValueSet(instance.getValuesByProp('dlc')),
		levels: toAllowedValueSet(instance.getValuesByProp('level')),
		noPlaces: toAllowedValueSet(instance.getValuesByProp('maps').flat()),
		noTags: toAllowedValueSet([
			...instance.getValuesByProp('tags').flat(),
			DYNAMIC_FOOD_TAG_MAP.popularNegative,
			DYNAMIC_FOOD_TAG_MAP.popularPositive,
		]),
		noTypes: toAllowedValueSet(instance.getValuesByProp('type')),
		places: toAllowedValueSet(instance.getValuesByProp('maps').flat()),
		tags: toAllowedValueSet([
			...instance.getValuesByProp('tags').flat(),
			DYNAMIC_FOOD_TAG_MAP.popularNegative,
			DYNAMIC_FOOD_TAG_MAP.popularPositive,
		]),
		types: toAllowedValueSet(instance.getValuesByProp('type')),
	},
	createDefaultFilters(): {
		availabilityDlcs: string[];
		contentDlcs: string[];
		levels: string[];
		noPlaces: TMapLabel[];
		noTags: TFoodTagId[];
		noTypes: TIngredientTypeId[];
		places: TMapLabel[];
		tags: TFoodTagId[];
		types: TIngredientTypeId[];
	} {
		return {
			availabilityDlcs: [],
			contentDlcs: [],
			levels: [],
			noPlaces: [],
			noTags: [],
			noTypes: [],
			places: [],
			tags: [],
			types: [],
		};
	},
	filterKinds: {
		availabilityDlcs: 'string',
		contentDlcs: 'string',
		levels: 'string',
		noPlaces: 'string',
		noTags: 'number',
		noTypes: 'number',
		places: 'string',
		tags: 'number',
		types: 'number',
	},
	pinyinSortState: PINYIN_SORT_STATE_MAP.none,
});

const state = {
	instance,

	persistence: persistenceShape.createDefault(),
	shared: {
		catalogLocalizationRevision: 0,
		hiddenItems: { dlcs: new Set<TDlc>() },

		famousShop: false,
		popularTrend: { isNegative: false, tag: null } as IPopularTrend,
	},
};

export const ingredientsStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migrateIngredientsPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-ingredients-storage',
			normalize: persistenceShape.normalize,
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: INGREDIENTS_STORE_VERSION.recordIdentity,
		}),
	],
}).computed((currentStore) => ({
	availableAvailabilityDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'availabilityDlcs',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(numberSort);
	},
	availableContentDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'dlc',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(numberSort);
	},
	availableLevels: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'level',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(numberSort);
	},
	availableMaps: () => {
		currentStore.shared.catalogLocalizationRevision.use();
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'maps',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.map(toGetValueCollection)
			.sort((left, right) => compareMapLabels(left.value, right.value));
	},
	availableNames: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			getNames(
				currentStore.shared.catalogLocalizationRevision.use(),
				currentStore.persistence.pinyinSortState.use()
			),
			instance.getValuesByProp(
				'name',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
		).map(toGetValueCollection);
	},
	availableTags: () => {
		currentStore.shared.catalogLocalizationRevision.use();
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const tags = [
			...instance.getValuesByProp(
				'tags',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			),
			DYNAMIC_FOOD_TAG_MAP.popularNegative,
			DYNAMIC_FOOD_TAG_MAP.popularPositive,
		];
		return tags.sort(compareFoodTagLabels).map(toGetValueCollection);
	},
	availableTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'type',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(compareIngredientTypes)
			.map(toGetValueCollection);
	},
}));

ingredientsStore.shared.hiddenItems.dlcs.onChange(() => {
	ingredientsStore.persistence.filters.set(
		persistenceShape.createDefault().filters
	);
});

registerCatalogLocalizationRevisionMirror((revision) => {
	ingredientsStore.shared.catalogLocalizationRevision.set(revision);
});
