import {store, createStoreContext} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {instances} from '@/methods';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const {
	food: {recipe: instance},
} = instances;

const recipesStore = store(
	{
		instance,
		dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
		levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),
		kitchenwares: instance.getValuesByProp(instance.data, 'kitchenware', true).sort(pinyinSort),
		positiveTags: instance.getValuesByProp(instance.data, 'positive', true).sort(pinyinSort),
		negativeTags: instance.getValuesByProp(instance.data, 'negative', true).sort(pinyinSort),
		ingredients: instance.getValuesByProp(instance.data, 'ingredients', true).sort(pinyinSort),
		page: {
			filters: {
				dlcs: [] as string[],
				levels: [] as string[],
				kitchenwares: [] as string[],
				positiveTags: [] as string[],
				noPositiveTags: [] as string[],
				negativeTags: [] as string[],
				noNegativeTags: [] as string[],
				ingredients: [] as string[],
				noIngredients: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
		},
	},
	{
		persist: {
			enabled: true,
			name: 'page-recipes-storage',
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

export const {Provider: RecipesStoreProvider, useStore: useRecipesStore} = createStoreContext(recipesStore);
