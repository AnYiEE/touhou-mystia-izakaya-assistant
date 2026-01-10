import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import { numberSort, sortBy, toGetValueCollection, toSet } from '@/utilities';
import { Beverage } from '@/utils';

const instance = Beverage.getInstance();

const storeVersion = { initial: 0, popular: 1 } as const;

const state = {
	instance,

	persistence: {
		filters: {
			dlcs: [] as string[],
			levels: [] as string[],
			noTags: [] as string[],
			tags: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const beveragesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-beverages-storage',
			version: storeVersion.popular,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
				if (version < storeVersion.popular) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					oldState.persistence = oldState.page;
					delete oldState.page;
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
	availableDlcs: () =>
		currentStore.instance
			.get()
			.getValuesByProp('dlc', true)
			.filter(
				({ value }) =>
					!currentStore.shared.hiddenItems.dlcs.use().has(value)
			)
			.sort(numberSort),
	availableLevels: () =>
		currentStore.instance
			.get()
			.getValuesByProp(
				'level',
				true,
				currentStore.instance
					.get()
					.data.filter(
						({ dlc }) =>
							!currentStore.shared.hiddenItems.dlcs.use().has(dlc)
					)
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
	availableTags: () =>
		sortBy(
			currentStore.instance.get().sortedTags,
			currentStore.instance.get().getValuesByProp(
				'tags',
				false,
				currentStore.instance
					.get()
					.data.filter(
						({ dlc }) =>
							!currentStore.shared.hiddenItems.dlcs.use().has(dlc)
					)
			)
		).map(toGetValueCollection),
}));

beveragesStore.shared.hiddenItems.dlcs.onChange(() => {
	beveragesStore.persistence.filters.set({
		dlcs: [],
		levels: [],
		noTags: [],
		tags: [],
	});
});
