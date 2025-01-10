import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {createNamesCache} from '@/stores/utils';
import {numberSort, toGetValueCollection} from '@/utilities';
import {Beverage} from '@/utils';

const instance = Beverage.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),
	levels: instance.getValuesByProp('level', true).sort(numberSort),
	tags: instance.sortedTags.map(toGetValueCollection),

	persistence: {
		filters: {
			dlcs: [] as string[],
			levels: [] as string[],
			noTags: [] as string[],
			tags: [] as string[],
		},
		pinyinSortState: PinyinSortState.NONE,
		searchValue: '',
	},
};

const getNames = createNamesCache(instance);

export const beveragesStore = store(state, {
	persist: {
		enabled: true,
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
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
