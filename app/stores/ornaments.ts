import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import { numberSort, sortBy, toGetValueCollection, toSet } from '@/utilities';
import { Ornament } from '@/utils';

const instance = Ornament.getInstance();

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

export const ornamentsStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-ornaments-storage',
			version: storeVersion.initial,

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
}));

ornamentsStore.shared.hiddenItems.dlcs.onChange(() => {
	ornamentsStore.persistence.filters.set({ dlcs: [] });
});
