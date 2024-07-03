import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';
import {union} from 'lodash';

import {type Selection} from '@nextui-org/react';

import {type TIngredientTag, type TRecipeTag} from '@/data/types';
import {ingredientInstance as instance_ingredient, recipeInstance as instance_recipe} from '@/methods/food';
import {pinyinSort} from '@/utils';

const ingredientTags = instance_ingredient.getValuesByProp(instance_ingredient.data, 'tags');
const recipePpositiveTags = instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags');
const popularValidTags = union(ingredientTags, recipePpositiveTags)
	.map((value) => ({value}))
	.sort(pinyinSort) as {
	value: TIngredientTag | TRecipeTag;
}[];

const storeVersion = {
	initial: 0,
} as const;

const state = {
	popularTags: popularValidTags,

	persistence: {
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
		version: storeVersion.initial,

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
