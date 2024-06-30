import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {recipeInstance as instance} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const recipesStore = store(
	{
		instance,

		dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
		levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),

		ingredients: instance.getValuesByProp(instance.data, 'ingredients', true).sort(pinyinSort),
		kitchenwares: instance.getValuesByProp(instance.data, 'kitchenware', true).sort(pinyinSort),
		negativeTags: instance.getValuesByProp(instance.data, 'negativeTags', true).sort(pinyinSort),
		positiveTags: instance.getValuesByProp(instance.data, 'positiveTags', true).sort(pinyinSort),

		page: {
			filters: {
				dlcs: [] as string[],
				ingredients: [] as string[],
				kitchenwares: [] as string[],
				levels: [] as string[],
				negativeTags: [] as string[],
				noIngredients: [] as string[],
				noNegativeTags: [] as string[],
				noPositiveTags: [] as string[],
				positiveTags: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
		},
	},
	{
		persist: {
			enabled: true,
			name: 'page-recipes-storage',
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

export const {Provider: RecipesStoreProvider, useStore: useRecipesStore} = createStoreContext(recipesStore);
