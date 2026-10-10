import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TBeverageTagId } from '@/domain/data/tags/types';
import { compareMapLabels } from '@/domain/places/localizedLabels';

import {
	createCatalogPersistenceShape,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import { registerCatalogLocalizationRevisionMirror } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	BEVERAGES_STORE_VERSION,
	migrateBeveragesPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = BeverageCatalog.getInstance();

const persistenceShape = createCatalogPersistenceShape({
	allowedValues: {
		availabilityDlcs: toAllowedValueSet(
			instance.getValuesByProp('availabilityDlcs')
		),
		contentDlcs: toAllowedValueSet(instance.getValuesByProp('dlc')),
		levels: toAllowedValueSet(instance.getValuesByProp('level')),
		noPlaces: toAllowedValueSet(instance.getValuesByProp('maps').flat()),
		noTags: toAllowedValueSet(instance.getValuesByProp('tags').flat()),
		places: toAllowedValueSet(instance.getValuesByProp('maps').flat()),
		tags: toAllowedValueSet(instance.getValuesByProp('tags').flat()),
	},
	createDefaultFilters(): {
		availabilityDlcs: string[];
		contentDlcs: string[];
		levels: string[];
		noPlaces: TMapLabel[];
		noTags: TBeverageTagId[];
		places: TMapLabel[];
		tags: TBeverageTagId[];
	} {
		return {
			availabilityDlcs: [],
			contentDlcs: [],
			levels: [],
			noPlaces: [],
			noTags: [],
			places: [],
			tags: [],
		};
	},
	filterKinds: {
		availabilityDlcs: 'string',
		contentDlcs: 'string',
		levels: 'string',
		noPlaces: 'string',
		noTags: 'number',
		places: 'string',
		tags: 'number',
	},
	pinyinSortState: PINYIN_SORT_STATE_MAP.none,
});

const state = {
	instance,

	persistence: persistenceShape.createDefault(),
	shared: {
		catalogLocalizationRevision: 0,
		hiddenItems: { dlcs: new Set<TDlc>() },
	},
};

const getNames = createNamesCache(instance);

export const beveragesStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migrateBeveragesPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-beverages-storage',
			normalize: persistenceShape.normalize,
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: BEVERAGES_STORE_VERSION.recordIdentity,
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
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const visibleTags = instance.getValuesByProp(
			'tags',
			false,
			filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
		);
		return visibleTags.sort(numberSort).map(toGetValueCollection);
	},
}));

beveragesStore.shared.hiddenItems.dlcs.onChange(() => {
	beveragesStore.persistence.filters.set(
		persistenceShape.createDefault().filters
	);
});

registerCatalogLocalizationRevisionMirror((revision) => {
	beveragesStore.shared.catalogLocalizationRevision.set(revision);
});
