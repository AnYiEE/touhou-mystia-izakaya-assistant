import {store} from '@davstack/store';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import {persist as persistMiddleware} from '@/stores/middlewares';
import {createNamesCache} from '@/stores/utils';
import {numberSort} from '@/utilities';
import {Ornament} from '@/utils';

const instance = Ornament.getInstance();

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
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
