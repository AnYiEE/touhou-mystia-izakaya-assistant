import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type {
	TCookerSeriesId,
	TCookerTypeId,
} from '@/domain/data/cookers/types';
import type { TDlc } from '@/domain/data/shared/types';

import {
	createCatalogPersistenceShape,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	COOKERS_STORE_VERSION,
	migrateCookersPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = CookerCatalog.getInstance();

const persistenceShape = createCatalogPersistenceShape({
	allowedValues: {
		availabilityDlcs: toAllowedValueSet(
			instance.getValuesByProp('availabilityDlcs')
		),
		contentDlcs: toAllowedValueSet(instance.getValuesByProp('dlc')),
		noSeries: toAllowedValueSet(instance.getValuesByProp('series')),
		noTypes: toAllowedValueSet(instance.getValuesByProp('availableTypes')),
		series: toAllowedValueSet(instance.getValuesByProp('series')),
		types: toAllowedValueSet(instance.getValuesByProp('availableTypes')),
	},
	createDefaultFilters(): {
		availabilityDlcs: string[];
		contentDlcs: string[];
		noSeries: TCookerSeriesId[];
		noTypes: TCookerTypeId[];
		series: TCookerSeriesId[];
		types: TCookerTypeId[];
	} {
		return {
			availabilityDlcs: [],
			contentDlcs: [],
			noSeries: [],
			noTypes: [],
			series: [],
			types: [],
		};
	},
	filterKinds: {
		availabilityDlcs: 'string',
		contentDlcs: 'string',
		noSeries: 'number',
		noTypes: 'number',
		series: 'number',
		types: 'number',
	},
	pinyinSortState: PINYIN_SORT_STATE_MAP.none,
});

const state = {
	instance,

	persistence: persistenceShape.createDefault(),
	shared: { hiddenItems: { dlcs: new Set<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migrateCookersPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-cookers-storage',
			normalize: persistenceShape.normalize,
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: COOKERS_STORE_VERSION.recordIdentity,
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
	availableNames: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			getNames(currentStore.persistence.pinyinSortState.use()),
			instance.getValuesByProp(
				'name',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
		).map(toGetValueCollection);
	},
	availableSeries: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const visibleSeries = instance.getValuesByProp(
			'series',
			false,
			filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
		);
		return instance.groupSeriesByLabel(visibleSeries.sort(numberSort));
	},
	availableTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const visibleTypes = instance.getValuesByProp(
			'availableTypes',
			false,
			filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
		);
		return visibleTypes.sort(numberSort).map(toGetValueCollection);
	},
}));

cookersStore.shared.hiddenItems.dlcs.onChange(() => {
	cookersStore.persistence.filters.set(
		persistenceShape.createDefault().filters
	);
});
