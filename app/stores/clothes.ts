import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TNameObject, getNames} from '@/stores/utils';
import {Clothes, numberSort} from '@/utils';

const instance = Clothes.getInstance();

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

const namesCache = new Map<PinyinSortState, TNameObject<Clothes>>();

export const clothesStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-clothes-storage',
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
