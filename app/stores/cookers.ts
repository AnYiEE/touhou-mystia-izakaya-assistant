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

const storeVersion = { initial: 0, removeSearchValue: 1 } as const;

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
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-cookers-storage',
			version: storeVersion.removeSearchValue,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
				if (version < storeVersion.removeSearchValue) {
					delete oldState.persistence.searchValue;
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
	availableCategories: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			instance.sortedCategories,
			instance.getValuesByProp(
				'category',
				false,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
		).map(toGetValueCollection);
	},
	availableDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp('dlc', true)
			.filter(({ value }) => !hiddenDlcs.has(value))
			.sort(numberSort);
	},
	availableNames: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			getNames(currentStore.persistence.pinyinSortState.use()),
			instance.getValuesByProp(
				'name',
				false,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
		).map(toGetValueCollection);
	},
	availableTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'type',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
			.sort(pinyinSort);
	},
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
