import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import type {TIngredientTag, TRecipeTag} from '@/data/types';
import {ingredientInstance as instance_ingredient, recipeInstance as instance_recipe} from '@/methods/food';
import {pinyinSort, union} from '@/utils';

export type TPopularTag = TIngredientTag | TRecipeTag;
export interface IPopularData {
	isNegative: boolean;
	tag: TPopularTag | null;
}

const ingredientTags = instance_ingredient.getValuesByProp(instance_ingredient.data, 'tags');
const recipePositiveTags = instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags');
const popularValidTags = union(ingredientTags, recipePositiveTags)
	.map((value) => ({value}))
	.sort(pinyinSort) as {
	value: TPopularTag;
}[];

const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
	tagsTooltip: 2,
} as const;

const state = {
	popularTags: popularValidTags,

	persistence: {
		customerCardTagsTooltip: true,
		dirver: [] as string[],
		popular: {
			isNegative: false,
			tag: null,
		} as IPopularData,
	},
};

const globalStore = store(state, {
	persist: {
		enabled: true,
		name: 'global-storage',
		version: storeVersion.tagsTooltip,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.dirver) {
				oldState.persistence.dirver = [];
			}
			if (version < storeVersion.tagsTooltip) {
				oldState.persistence.customerCardTagsTooltip = true;
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
		read: () => new Set([currentStore.persistence.popular.tag.use()]) as SelectionSet,
		write: (tags: Selection) => {
			const tag = [...tags][0] as typeof state.persistence.popular.tag;
			currentStore.persistence.popular.assign({
				tag: tag || null,
			});
		},
	},
}));

export const {Provider: GlobalStoreProvider, useStore: useGlobalStore} = createStoreContext(globalStore);
