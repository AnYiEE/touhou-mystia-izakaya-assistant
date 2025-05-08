import {store} from '@davstack/store';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import {persist as persistMiddleware} from '@/stores/middlewares';
import {createNamesCache} from '@/stores/utils';
import {Currency} from '@/utils';

const instance = Currency.getInstance();

const storeVersion = {
	initial: 0,
} as const;

const state = {
	instance,

	persistence: {
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
};

const getNames = createNamesCache(instance);

export const currenciesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-currencies-storage',
			version: storeVersion.initial,

			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
		}),
	],
}).computed((currentStore) => ({
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
