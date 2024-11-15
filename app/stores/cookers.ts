import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {createNamesCache} from '@/stores/utils';
import {Cooker, numberSort, pinyinSort, toValueObject} from '@/utils';

const instance = Cooker.getInstance();

const storeVersion = {
	initial: 0,
} as const;

const state = {
	instance,

	categories: instance.sortedCategories.map(toValueObject),
	dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
	types: instance.getValuesByProp(instance.data, 'type', true).sort(pinyinSort),

	persistence: {
		filters: {
			dlcs: [] as string[], // eslint-disable-next-line sort-keys
			categories: [] as string[],
			noCategories: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
		},
		pinyinSortState: PinyinSortState.NONE,
		searchValue: '',
	},
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-cookers-storage',
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
