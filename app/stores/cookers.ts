import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import {
	numberSort,
	pinyinSort,
	sortBy,
	toGetValueCollection,
	toSet,
} from '@/utilities';
import { Cooker } from '@/utils';
import { filterAvailableItemsByHiddenDlcs } from '@/utils/availability';

const instance = Cooker.getInstance();

const storeVersion = {
	initial: 0,
	removeSearchValue: 1, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 2,
} as const;

const state = {
	instance,

	persistence: {
		filters: {
			availabilityDlcs: [] as string[],
			categories: [] as string[],
			contentDlcs: [] as string[],
			noCategories: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-cookers-storage',
			version: storeVersion.availabilityDlcFilter,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
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
				return persistedState as typeof state;
			},
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
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
	availableCategories: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			instance.sortedCategories,
			instance.getValuesByProp(
				'category',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
		).map(toGetValueCollection);
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
	availableTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'type',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(pinyinSort);
	},
}));

cookersStore.shared.hiddenItems.dlcs.onChange(() => {
	cookersStore.persistence.filters.set({
		availabilityDlcs: [],
		categories: [],
		contentDlcs: [],
		noCategories: [],
		noTypes: [],
		types: [],
	});
});
