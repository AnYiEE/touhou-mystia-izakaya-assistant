import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import { numberSort, toSet } from '@/utilities';
import { Clothes } from '@/utils';

const instance = Clothes.getInstance();

const storeVersion = { initial: 0 } as const;

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

export const clothesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-clothes-storage',
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
