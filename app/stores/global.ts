import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import type {IPersistenceState} from './types';
import type {TIngredientTag, TRecipeTag} from '@/data/types';
import {Ingredient, Recipe, pinyinSort, toValueObject, union} from '@/utils';

export type TPopularTag = TIngredientTag | TRecipeTag;
export interface IPopularData {
	isNegative: boolean;
	tag: TPopularTag | null;
}

const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const ingredientTags = instance_ingredient.getValuesByProp(instance_ingredient.data, 'tags');
const recipePositiveTags = instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags');
const popularValidTags = union(ingredientTags, recipePositiveTags).map(toValueObject).sort(pinyinSort) as {
	value: TPopularTag;
}[];

const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
	tagsTooltip: 2,
	version: 3, // eslint-disable-next-line sort-keys
	backgroundImage: 4,
	tachie: 5,
	vibrate: 6,
} as const;

const state = {
	popularTags: popularValidTags,

	persistence: {
		backgroundImage: true,
		customerCardTagsTooltip: true,
		tachie: true,
		vibrate: true,

		dirver: [] as string[],
		popular: {
			isNegative: false,
			tag: null,
		} as IPopularData,

		version: null as string | null,
	},
};

export type TGlobalPersistenceState = IPersistenceState<(typeof state)['persistence']>;

export const globalStoreKey = 'global-storage';

export const globalStore = store(state, {
	persist: {
		enabled: true,
		name: globalStoreKey,
		version: storeVersion.vibrate,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.dirver) {
				oldState.persistence.dirver = [];
			}
			if (version < storeVersion.tagsTooltip) {
				oldState.persistence.customerCardTagsTooltip = true;
			}
			if (version < storeVersion.version) {
				oldState.persistence.version = null;
			}
			if (version < storeVersion.backgroundImage) {
				oldState.persistence.backgroundImage = true;
			}
			if (version < storeVersion.tachie) {
				oldState.persistence.tachie = true;
			}
			if (version < storeVersion.vibrate) {
				oldState.persistence.vibrate = true;
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
			currentStore.persistence.popular.tag.set(tag || null);
		},
	},
}));
