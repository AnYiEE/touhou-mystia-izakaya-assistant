import {store} from '@davstack/store';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import {DYNAMIC_TAG_MAP, type TIngredientTag} from '@/data';
import {persist as persistMiddleware} from '@/stores/middlewares';
import {createIndexDBStorage, createNamesCache} from '@/stores/utils';
import type {IPopularTrend} from '@/types';
import {numberSort, pinyinSort, toArray, toGetValueCollection} from '@/utilities';
import {Ingredient} from '@/utils';

const instance = Ingredient.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	filterTypes: 2,
} as const;

const getNames = createNamesCache(instance);

const state = {
	instance,

	dlcs: instance.getValuesByProp('dlc', true).sort(numberSort),
	levels: instance.getValuesByProp('level', true).sort(numberSort),
	tags: toArray<TIngredientTag[]>(
		instance.getValuesByProp('tags'),
		DYNAMIC_TAG_MAP.popularNegative,
		DYNAMIC_TAG_MAP.popularPositive
	)
		.map(toGetValueCollection)
		.sort(pinyinSort),
	types: instance.sortedTypes.map(toGetValueCollection),

	persistence: {
		filters: {
			dlcs: [] as string[],
			levels: [] as string[],
			noTags: [] as string[],
			tags: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
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

export const ingredientsStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-ingredients-storage',
			version: storeVersion.filterTypes,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
				if (version < storeVersion.popular) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					oldState.persistence = oldState.page;
					delete oldState.page;
				}
				if (version < storeVersion.filterTypes) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: {filters},
					} = oldState;
					filters.types = [];
					filters.noTypes = [];
				}
				return persistedState as typeof state;
			},
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			storage: createIndexDBStorage(),
		}),
	],
}).computed((currentStore) => ({
	names: () => getNames(currentStore.persistence.pinyinSortState.use()),
}));
