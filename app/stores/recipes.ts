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
import { filterAvailableItemsByHiddenDlcs } from '@/utils/availability';

const instance = Recipe.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	cooker: 2,
	filterPlaces: 3,
	removeSearchValue: 4, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 5,
} as const;

const state = {
	instance,

	persistence: {
		filters: {
			availabilityDlcs: [] as string[],
			contentDlcs: [] as string[],
			cookers: [] as string[],
			ingredients: [] as string[],
			levels: [] as string[],
			negativeTags: [] as string[],
			noIngredients: [] as string[],
			noNegativeTags: [] as string[],
			noPlaces: [] as string[],
			noPositiveTags: [] as string[],
			places: [] as string[],
			positiveTags: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
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
			version: storeVersion.availabilityDlcFilter,

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
				if (version < storeVersion.filterPlaces) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: { filters },
					} = oldState;
					filters.places = [];
					filters.noPlaces = [];
				}
				if (version < storeVersion.removeSearchValue) {
					delete oldState.persistence.searchValue;
				}
				if (version < storeVersion.availabilityDlcFilter) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					oldState.persistence.filters.contentDlcs =
						oldState.persistence.filters.dlcs;
					oldState.persistence.filters.availabilityDlcs = [];
					delete oldState.persistence.filters.dlcs;
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
	availableAvailabilityDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'availabilityDlcs',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(numberSort);
	},
	availableContentDlcs: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'dlc',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(numberSort);
	},
	availableCookers: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'cooker',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(pinyinSort);
	},
	availableIngredients: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'ingredients',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(pinyinSort);
	},
	availableLevels: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'level',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
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
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
		).map(toGetValueCollection);
	},
	availableNegativeTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'negativeTags',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(pinyinSort);
	},
	availablePlaces: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return instance
			.getValuesByProp(
				'places',
				true,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort(pinyinSort);
	},
	availablePositiveTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return toArray<TRecipeTag[]>(
			instance.getValuesByProp(
				'positiveTags',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
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
		availabilityDlcs: [],
		contentDlcs: [],
		cookers: [],
		ingredients: [],
		levels: [],
		negativeTags: [],
		noIngredients: [],
		noNegativeTags: [],
		noPlaces: [],
		noPositiveTags: [],
		places: [],
		positiveTags: [],
	});
});
