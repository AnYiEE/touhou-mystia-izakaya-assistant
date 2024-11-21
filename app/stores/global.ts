import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import type {IPersistenceState} from './types';
import {type DARK_MATTER_TAG, type TIngredientTag, type TRecipeTag} from '@/data';
import {customerNormalStore, customerRareStore, ingredientsStore, recipesStore} from '@/stores';
import {Ingredient, Recipe, pinyinSort, toValueObject, union} from '@/utils';

export type TPopularTag = Exclude<TIngredientTag, '特产' | '天罚'> | Exclude<TRecipeTag, typeof DARK_MATTER_TAG>;
export interface IPopularData {
	isNegative: boolean;
	tag: TPopularTag | null;
}

const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const ingredientTags = instance_ingredient
	.getValuesByProp(instance_ingredient.data, 'tags')
	.filter((tag) => !instance_ingredient.blockedTags.has(tag));

const recipePositiveTags = instance_recipe
	.getValuesByProp(instance_recipe.data, 'positiveTags')
	.filter((tag) => !instance_recipe.blockedTags.has(tag));

const popularValidTags = (union(ingredientTags, recipePositiveTags) as TPopularTag[])
	.map(toValueObject)
	.sort(pinyinSort);

const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
	tagsTooltip: 2,
	version: 3, // eslint-disable-next-line sort-keys
	backgroundImage: 4,
	tachie: 5,
	vibrate: 6, // eslint-disable-next-line sort-keys
	renameBg: 7, // eslint-disable-next-line sort-keys
	famousShop: 8,
} as const;

const state = {
	popularTags: popularValidTags,

	persistence: {
		customerCardTagsTooltip: true,

		dirver: [] as string[],
		famousShop: false,
		popular: {
			isNegative: false,
			tag: null,
		} as IPopularData,

		highAppearance: true,
		tachie: true,
		vibrate: true,

		version: null as string | null,
	},
};

export type TGlobalPersistenceState = IPersistenceState<(typeof state)['persistence']>;

export const globalStoreKey = 'global-storage';

export const globalStore = store(state, {
	persist: {
		enabled: true,
		name: globalStoreKey,
		version: storeVersion.renameBg,

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
			if (version < storeVersion.renameBg) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {persistence} = oldState;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				persistence.highAppearance = persistence.backgroundImage;
				delete persistence.backgroundImage;
			}
			if (version < storeVersion.famousShop) {
				oldState.persistence.famousShop = false;
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

globalStore.persistence.highAppearance.onChange((isEnabled) => {
	document.body.classList.toggle('bg-blend-mystia-pseudo', isEnabled);
});

// Update the current famous shop state when there is a change in the persisted state.
globalStore.persistence.famousShop.onChange((famousShop) => {
	customerNormalStore.shared.customer.famousShop.set(famousShop);
	customerRareStore.shared.customer.famousShop.set(famousShop);
	ingredientsStore.shared.famousShop.set(famousShop);
	recipesStore.shared.famousShop.set(famousShop);
});

// Update the current popular tag when there is a change in the persisted popular tag data.
globalStore.persistence.popular.onChange((popular) => {
	customerNormalStore.shared.customer.popular.assign(popular);
	customerRareStore.shared.customer.popular.assign(popular);
	ingredientsStore.shared.popular.assign(popular);
	recipesStore.shared.popular.assign(popular);
});
