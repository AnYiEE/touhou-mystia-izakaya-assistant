import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type TDlc } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import {
	numberSort,
	pinyinSort,
	toGetValueCollection,
	toSet,
} from '@/utilities';
import { Cooker } from '@/utils';

const instance = Cooker.getInstance();

const storeVersion = { initial: 0 } as const;

const state = {
	instance,

	categories: instance.sortedCategories.map(toGetValueCollection),
	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),
	types: instance.getValuesByProp('type', true).sort(pinyinSort),

	persistence: {
		filters: {
			dlcs: [] as string[], // eslint-disable-next-line sort-keys
			categories: [] as string[],
			noCategories: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: { hiddenItems: { dlcs: toSet<TDlc>() } },
};

const getNames = createNamesCache(instance);

export const cookersStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-cookers-storage',
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
