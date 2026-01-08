import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import { numberSort, toSet } from '@/utilities';
import { Currency } from '@/utils';

const instance = Currency.getInstance();

const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	filterDlcs: 1,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),

	persistence: {
		filters: { dlcs: [] as string[] },
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const currenciesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-currencies-storage',
			version: storeVersion.filterDlcs,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
				if (version < storeVersion.filterDlcs) {
					oldState.persistence.filters = { dlcs: [] };
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
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
