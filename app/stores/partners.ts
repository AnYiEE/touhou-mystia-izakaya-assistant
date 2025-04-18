import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import {createNamesCache} from '@/stores/utils';
import {numberSort} from '@/utilities';
import {Partner} from '@/utils';

const instance = Partner.getInstance();

const storeVersion = {
	initial: 0,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),

	persistence: {
		filters: {
			dlcs: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
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
