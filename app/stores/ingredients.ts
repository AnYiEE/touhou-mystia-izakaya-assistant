import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {ingredientInstance as instance} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const ingredientsStore = store(
	{
		instance,

		dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
		levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),
		tags: instance.getValuesByProp(instance.data, 'tags', true).sort(pinyinSort),

		page: {
			filters: {
				dlcs: [] as string[],
				levels: [] as string[],
				noTags: [] as string[],
				tags: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
		},
	},
	{
		persist: {
			enabled: true,
			name: 'page-ingredients-storage',
			partialize: (currentStore) =>
				({
					page: currentStore.page,
				}) as typeof currentStore,
			storage: createJSONStorage(() => localStorage),
		},
	}
).computed((currentStore) => ({
	names: () => getAllItemNames(instance, currentStore.page.pinyinSortState.get()),
}));

export const {Provider: IngredientsStoreProvider, useStore: useIngredientsStore} = createStoreContext(ingredientsStore);
