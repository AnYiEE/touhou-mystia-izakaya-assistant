import {store} from '@davstack/store';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import {DYNAMIC_TAG_MAP, type TRecipeTag} from '@/data';
import {persist as persistMiddleware} from '@/stores/middlewares';
import {createNamesCache} from '@/stores/utils';
import type {IPopularTrend} from '@/types';
import {numberSort, pinyinSort, toArray, toGetValueCollection} from '@/utilities';
import {Recipe} from '@/utils';

const instance = Recipe.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	cooker: 2,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),
	levels: instance.getValuesByProp('level', true).sort(numberSort),

	cookers: instance.getValuesByProp('cooker', true).sort(pinyinSort),
	ingredients: instance.getValuesByProp('ingredients', true).sort(pinyinSort),
	negativeTags: instance.getValuesByProp('negativeTags', true).sort(pinyinSort),
	positiveTags: toArray<TRecipeTag[]>(
		instance.getValuesByProp('positiveTags'),
		DYNAMIC_TAG_MAP.popularNegative,
		DYNAMIC_TAG_MAP.popularPositive
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
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
		searchValue: '',
	},
	shared: {
		famousShop: false,
		popularTrend: {
			isNegative: false,
			tag: null,
		} as IPopularTrend,
	},
};

const getNames = createNamesCache(instance);

export const recipesStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
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
		}),
	],
}).computed((currentStore) => ({
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
