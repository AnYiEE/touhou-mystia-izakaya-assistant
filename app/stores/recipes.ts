import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { DYNAMIC_TAG_MAP, type TDlc, type TRecipeTag } from '@/data';
import { persist as persistMiddleware } from '@/stores/middlewares';
import { createNamesCache } from '@/stores/utils';
import type { IPopularTrend } from '@/types';
import {
	numberSort,
	pinyinSort,
	sortBy,
	toArray,
	toGetValueCollection,
	toSet,
} from '@/utilities';
import { Recipe } from '@/utils';

const instance = Recipe.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	cooker: 2,
} as const;

const state = {
	instance,

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
		hiddenItems: { dlcs: toSet<TDlc>() },

		famousShop: false,
		popularTrend: { isNegative: false, tag: null } as IPopularTrend,
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
					oldState.persistence.filters.cookers =
						oldState.persistence.filters.kitchenwares;
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
	availableCookers: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'cooker',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
			.sort(pinyinSort);
	},
	availableDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp('dlc', true)
			.filter(({ value }) => !hiddenDlcs.has(value))
			.sort(numberSort);
	},
	availableIngredients: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'ingredients',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
			.sort(pinyinSort);
	},
	availableLevels: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'level',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
			.sort(numberSort);
	},
	availableNames: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			getNames(currentStore.persistence.pinyinSortState.use()),
			instance.getValuesByProp(
				'name',
				false,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
		).map(toGetValueCollection);
	},
	availableNegativeTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'negativeTags',
				true,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			)
			.sort(pinyinSort);
	},
	availablePositiveTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return toArray<TRecipeTag[]>(
			instance.getValuesByProp(
				'positiveTags',
				false,
				instance.data.filter(({ dlc }) => !hiddenDlcs.has(dlc))
			),
			DYNAMIC_TAG_MAP.popularNegative,
			DYNAMIC_TAG_MAP.popularPositive
		)
			.map(toGetValueCollection)
			.sort(pinyinSort);
	},
}));

recipesStore.shared.hiddenItems.dlcs.onChange(() => {
	recipesStore.persistence.filters.set({
		cookers: [],
		dlcs: [],
		ingredients: [],
		levels: [],
		negativeTags: [],
		noIngredients: [],
		noNegativeTags: [],
		noPositiveTags: [],
		positiveTags: [],
	});
});
