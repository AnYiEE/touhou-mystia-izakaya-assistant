import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {createNamesCache} from '@/stores/utils';
import {Partner, numberSort} from '@/utils';

const instance = Partner.getInstance();

const storeVersion = {
	initial: 0,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),

	persistence: {
		filters: {
			dlcs: [] as string[],
		},
		pinyinSortState: PinyinSortState.NONE,
		searchValue: '',
	},
};

const getNames = createNamesCache(instance);

export const partnersStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-partners-storage',
		version: storeVersion.initial,

		partialize: (currentStore) =>
			({
				persistence: currentStore.persistence,
			}) as typeof currentStore,
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
