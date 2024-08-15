import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {recipeInstance as instance} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	cooker: 2,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
	levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),

	cookers: instance.getValuesByProp(instance.data, 'cooker', true).sort(pinyinSort),
	ingredients: instance.getValuesByProp(instance.data, 'ingredients', true).sort(pinyinSort),
	negativeTags: instance.getValuesByProp(instance.data, 'negativeTags', true).sort(pinyinSort),
	positiveTags: instance.getValuesByProp(instance.data, 'positiveTags', true).sort(pinyinSort),

	persistence: {
		filters: {
			cookers: [] as string[],
			dlcs: [] as string[],
			ingredients: [] as string[],
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
};

export const recipesStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-recipes-storage',
		version: storeVersion.cooker,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.popular) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence = oldState.page;
				delete oldState.page;
			}
			if (version < storeVersion.cooker) {
				// cSpell:ignore kitchenwares
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence.filters.cookers = oldState.persistence.filters.kitchenwares;
				delete oldState.persistence.filters.kitchenwares;
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
	names: () => getAllItemNames(instance, currentStore.persistence.pinyinSortState.use()),
}));
