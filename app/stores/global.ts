import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import type {IPersistenceState} from './types';
import {customerNormalStore, customerRareStore, ingredientsStore, recipesStore} from '@/stores';
import type {IPopularTrend, TPopularTag} from '@/types';
import {pinyinSort, toArray, toGetValueCollection, toSet, union} from '@/utilities';
import {Ingredient, Recipe} from '@/utils';

const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const ingredientTags = instance_ingredient
	.getValuesByProp('tags')
	.filter((tag) => !instance_ingredient.blockedTags.has(tag));

const recipePositiveTags = instance_recipe
	.getValuesByProp('positiveTags')
	.filter((tag) => !instance_recipe.blockedTags.has(tag));

const validPopularTags = (union(ingredientTags, recipePositiveTags) as TPopularTag[])
	.map(toGetValueCollection)
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
	popularTrend: 9,
} as const;

const state = {
	popularTags: validPopularTags,

	persistence: {
		customerCardTagsTooltip: true,

		dirver: [] as string[],
		famousShop: false,
		popularTrend: {
			isNegative: false,
			tag: null,
		} as IPopularTrend,

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
		version: storeVersion.popularTrend,

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
			if (version < storeVersion.popularTrend) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {persistence} = oldState;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				persistence.popularTrend = persistence.popular;
				delete persistence.popular;
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
		read: () => toSet([currentStore.persistence.popularTrend.tag.use()]) as SelectionSet,
		write: (tags: Selection) => {
			const tag = toArray(tags as SelectionSet)[0] as typeof state.persistence.popularTrend.tag;
			currentStore.persistence.popularTrend.tag.set(tag || null);
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

// Update the current popular trend when there is a change in the persisted popular trend data.
globalStore.persistence.popularTrend.onChange((popularTrend) => {
	customerNormalStore.shared.customer.popularTrend.assign(popularTrend);
	customerRareStore.shared.customer.popularTrend.assign(popularTrend);
	ingredientsStore.shared.popularTrend.assign(popularTrend);
	recipesStore.shared.popularTrend.assign(popularTrend);
});
