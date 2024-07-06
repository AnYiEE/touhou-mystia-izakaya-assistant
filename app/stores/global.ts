import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';
import {union} from 'lodash';

import {type Selection} from '@nextui-org/react';

import {type TIngredientTag, type TRecipeTag} from '@/data/types';
import {ingredientInstance as instance_ingredient, recipeInstance as instance_recipe} from '@/methods/food';
import {pinyinSort} from '@/utils';

const ingredientTags = instance_ingredient.getValuesByProp(instance_ingredient.data, 'tags');
const recipePositiveTags = instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags');
const popularValidTags = union(ingredientTags, recipePositiveTags)
	.map((value) => ({value}))
	.sort(pinyinSort) as {
	value: TIngredientTag | TRecipeTag;
}[];

const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
} as const;

const state = {
	popularTags: popularValidTags,

	persistence: {
		dirver: [] as string[],
		popular: {
			isNegative: false,
			tag: null as TIngredientTag | TRecipeTag | null,
		},
	},
};

const globalStore = store(state, {
	persist: {
		enabled: true,
		name: 'global-storage',
		version: storeVersion.dirver,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.dirver) {
				oldState.persistence.dirver = [];
			}
			return persistedState as typeof state;
		},
		partialize(currentStore) {
			return {
				persistence: currentStore.persistence,
			} as typeof currentStore;
		},
		storage: createJSONStorage(() => localStorage),
	},
}).computed((currentStore) => ({
	selectedPopularTag: {
		read: () => new Set([currentStore.persistence.popular.tag.use()]) as Selection,
		write: (tags: Selection) => {
			const tag = [...tags][0] as typeof state.persistence.popular.tag;
			currentStore.persistence.popular.assign({
				tag: tag || null,
			});
		},
	},
}));

export const {Provider: GlobalStoreProvider, useStore: useGlobalStore} = createStoreContext(globalStore);
