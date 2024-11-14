import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TNameObject, getNames} from '@/stores/utils';
import {Currency} from '@/utils';

const instance = Currency.getInstance();

const storeVersion = {
	initial: 0,
} as const;

const state = {
	instance,

	persistence: {
		pinyinSortState: PinyinSortState.NONE,
		searchValue: '',
	},
};

const namesCache = new Map<PinyinSortState, TNameObject<Currency>>();

export const currenciesStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-currencies-storage',
		version: storeVersion.initial,

		partialize: (currentStore) =>
			({
				persistence: currentStore.persistence,
			}) as typeof currentStore,
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	names: () => getNames(namesCache, instance, currentStore.persistence.pinyinSortState.use()),
}));
