import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE, type TRecipeTag} from '@/data';
import {createNamesCache} from '@/stores/utils';
import type {IPopularTrend} from '@/types';
import {numberSort, pinyinSort, toGetValueCollection} from '@/utilities';
import {Recipe} from '@/utils';

const instance = Recipe.getInstance();

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
	positiveTags: (
		[
			...instance.getValuesByProp(instance.data, 'positiveTags'),
			TAG_POPULAR_NEGATIVE,
			TAG_POPULAR_POSITIVE,
		] as TRecipeTag[]
	)
		.map(toGetValueCollection)
		.sort(pinyinSort),

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
	shared: {
		famousShop: false,
		popular: {
			isNegative: false,
			tag: null,
		} as IPopularTrend,
	},
};

const getNames = createNamesCache(instance);

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
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
