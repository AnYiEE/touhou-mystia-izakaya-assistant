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
	availableDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp('dlc', true)
			.filter(({ value }) => !hiddenDlcs.has(value))
			.sort(numberSort);
	},
	availableLevels: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'level',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
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
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
		).map(toGetValueCollection);
	},
	availableTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			instance.sortedTags,
			instance.getValuesByProp(
				'tags',
				false,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
		).map(toGetValueCollection);
	},
}));

beveragesStore.shared.hiddenItems.dlcs.onChange(() => {
	beveragesStore.persistence.filters.set({
		dlcs: [],
		levels: [],
		noTags: [],
		tags: [],
	});
});
