import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {getAllItemNames} from '@/stores/utils';
import {Ornament, numberSort} from '@/utils';

const instance = Ornament.getInstance();

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

export const ornamentsStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-ornaments-storage',
		version: storeVersion.initial,

		partialize: (currentStore) =>
			({
				persistence: currentStore.persistence,
			}) as typeof currentStore,
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	names: () => getAllItemNames(instance, currentStore.persistence.pinyinSortState.use()),
}));
