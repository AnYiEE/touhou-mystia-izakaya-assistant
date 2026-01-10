import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import { numberSort, sortBy, toGetValueCollection, toSet } from '@/utilities';
import { Clothes } from '@/utils';

const instance = Clothes.getInstance();

const storeVersion = { initial: 0 } as const;

const state = {
	instance,

	persistence: {
		filters: { dlcs: [] as string[] },
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const clothesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-clothes-storage',
			version: storeVersion.initial,

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
}));

clothesStore.shared.hiddenItems.dlcs.onChange(() => {
	clothesStore.persistence.filters.set({ dlcs: [] });
});
