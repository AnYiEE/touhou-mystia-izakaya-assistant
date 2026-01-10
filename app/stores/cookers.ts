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

const instance = Cooker.getInstance();

const storeVersion = { initial: 0 } as const;

const state = {
	instance,

	persistence: {
		filters: {
			dlcs: [] as string[], // eslint-disable-next-line sort-keys
			categories: [] as string[],
			noCategories: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-cookers-storage',
			version: storeVersion.initial,

			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
		}),
	],
}).computed((currentStore) => ({
	availableCategories: () =>
		sortBy(
			currentStore.instance.get().sortedCategories,
			currentStore.instance.get().getValuesByProp(
				'category',
				false,
				currentStore.instance
					.get()
					.data.filter(
						({ dlc }) =>
							!currentStore.shared.hiddenItems.dlcs.use().has(dlc)
					)
			)
		).map(toGetValueCollection),
	availableDlcs: () =>
		currentStore.instance
			.get()
			.getValuesByProp('dlc', true)
			.filter(
				({ value }) =>
					!currentStore.shared.hiddenItems.dlcs.use().has(value)
			)
			.sort(numberSort),
	availableNames: () =>
		sortBy(
			getNames(currentStore.persistence.pinyinSortState.use()),
			currentStore.instance.get().getValuesByProp(
				'name',
				false,
				currentStore.instance
					.get()
					.data.filter(
						({ dlc }) =>
							!currentStore.shared.hiddenItems.dlcs.use().has(dlc)
					)
			)
		).map(toGetValueCollection),
	availableTypes: () =>
		currentStore.instance
			.get()
			.getValuesByProp(
				'type',
				true,
				currentStore.instance
					.get()
					.data.filter(
						({ dlc }) =>
							!currentStore.shared.hiddenItems.dlcs.use().has(dlc)
					)
			)
			.sort(pinyinSort),
}));

cookersStore.shared.hiddenItems.dlcs.onChange(() => {
	cookersStore.persistence.filters.set({
		categories: [],
		dlcs: [],
		noCategories: [],
		noTypes: [],
		types: [],
	});
});
