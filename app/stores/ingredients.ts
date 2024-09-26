import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {TAG_POPULAR_NEGATIVE, TAG_POPULAR_POSITIVE} from '@/data';
import type {TIngredientTag} from '@/data/types';
import {type IPopularData} from '@/stores';
import {getAllItemNames} from '@/stores/utils';
import {Ingredient, numberSort, pinyinSort, toValueObject} from '@/utils';

const instance = Ingredient.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	filterTypes: 2,
} as const;

const state = {
	instance,

	dlcs: instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort),
	levels: instance.getValuesByProp(instance.data, 'level', true).sort(numberSort),
	tags: (
		[
			...instance.getValuesByProp(instance.data, 'tags'),
			TAG_POPULAR_NEGATIVE,
			TAG_POPULAR_POSITIVE,
		] as TIngredientTag[]
	)
		.map(toValueObject)
		.sort(pinyinSort),
	types: instance.sortedTypes.map(toValueObject),

	persistence: {
		filters: {
			dlcs: [] as string[],
			levels: [] as string[],
			noTags: [] as string[],
			tags: [] as string[],
			types: [] as string[], // eslint-disable-next-line sort-keys
			noTypes: [] as string[],
		},
		pinyinSortState: PinyinSortState.NONE,
		searchValue: '',
	},
	shared: {
		popular: {
			isNegative: false,
			tag: null,
		} as IPopularData,
	},
};

export const ingredientsStore = store(state, {
	persist: {
		enabled: true,
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
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	names: () => getAllItemNames(instance, currentStore.persistence.pinyinSortState.use()),
}));
