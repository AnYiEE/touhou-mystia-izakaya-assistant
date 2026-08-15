import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import type { TDlc } from '@/domain/data/shared/types';

import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	CLOTHES_STORE_VERSION,
	migrateClothesPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = ClothesCatalog.getInstance();

const state = {
	instance,

	persistence: {
		filters: {
			availabilityDlcs: [] as string[],
			contentDlcs: [] as string[],
		},
		pinyinSortState: PINYIN_SORT_STATE_MAP.none as TPinyinSortState,
	},
	shared: { hiddenItems: { dlcs: new Set<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const clothesStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migrateClothesPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-clothes-storage',
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: CLOTHES_STORE_VERSION.availabilityDlcFilter,
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

clothesStore.shared.hiddenItems.dlcs.onChange(() => {
	clothesStore.persistence.filters.set({
		availabilityDlcs: [],
		contentDlcs: [],
	});
});
