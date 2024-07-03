import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {ingredientInstance as instance} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const storeVersion = {
	initial: 0,
	popular: 1,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
	levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),
	tags: instance.getValuesByProp(instance.data, 'tags', true).sort(pinyinSort),

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

const ingredientsStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-ingredients-storage',
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
	names: () => getAllItemNames(instance, currentStore.persistence.pinyinSortState.get()),
}));

export const {Provider: IngredientsStoreProvider, useStore: useIngredientsStore} = createStoreContext(ingredientsStore);
