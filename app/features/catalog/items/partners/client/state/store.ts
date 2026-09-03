import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
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
	PARTNERS_STORE_VERSION,
	migratePartnersPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = PartnerCatalog.getInstance();

const persistenceShape = createCatalogPersistenceShape({
	allowedValues: {
		availabilityDlcs: toAllowedValueSet(
			instance.getValuesByProp('availabilityDlcs')
		),
		contentDlcs: toAllowedValueSet(instance.getValuesByProp('dlc')),
	},
	createDefaultFilters(): {
		availabilityDlcs: string[];
		contentDlcs: string[];
	} {
		return { availabilityDlcs: [], contentDlcs: [] };
	},
	filterKinds: { availabilityDlcs: 'string', contentDlcs: 'string' },
	pinyinSortState: PINYIN_SORT_STATE_MAP.none,
});

const state = {
	instance,

	persistence: persistenceShape.createDefault(),
	shared: { hiddenItems: { dlcs: new Set<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const partnersStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migratePartnersPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-partners-storage',
			normalize: persistenceShape.normalize,
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: PARTNERS_STORE_VERSION.availabilityDlcFilter,
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
}));

partnersStore.shared.hiddenItems.dlcs.onChange(() => {
	partnersStore.persistence.filters.set(
		persistenceShape.createDefault().filters
	);
});
