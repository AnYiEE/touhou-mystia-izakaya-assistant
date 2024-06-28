import {store, createStoreContext} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {instances} from '@/methods';
import {getAllItemNames} from '@/stores/utils';
import {numberSort} from '@/utils';

const {
	food: {beverage: instance},
} = instances;

const beveragesStore = store(
	{
		instance,
		dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
		levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),
		tags: instance.sortedTag.map((value) => ({value})),
		page: {
			filters: {
				dlc: [] as string[],
				level: [] as string[],
				tag: [] as string[],
				noTag: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
		},
	},
	{
		persist: {
			enabled: true,
			name: 'page-beverages-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (store) =>
				({
					page: store.page,
				}) as typeof store,
		},
	}
).computed((store) => ({
	names: () => getAllItemNames(instance, store.page.pinyinSortState.get()),
}));

export const {Provider: BeveragesStoreProvider, useStore: useBeveragesStore} = createStoreContext(beveragesStore);
