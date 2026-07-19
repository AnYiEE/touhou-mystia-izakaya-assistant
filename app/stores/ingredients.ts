import { store } from '@davstack/store';

import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { DYNAMIC_TAG_MAP, type TDlc, type TIngredientTag } from '@/data';
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
import { Ingredient } from '@/utils';
import { filterAvailableItemsByHiddenDlcs } from '@/utils/availability';

const instance = Ingredient.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	filterTypes: 2, // eslint-disable-next-line sort-keys
	filterPlaces: 3,
	removeSearchValue: 4, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 5,
} as const;

const getNames = createNamesCache(instance);

const state = {
	instance,

	persistence: {
		filters: {
			availabilityDlcs: [] as string[],
			contentDlcs: [] as string[],
			levels: [] as string[],
			noPlaces: [] as string[],
			noTags: [] as string[],
			noTypes: [] as string[],
			places: [] as string[],
			tags: [] as string[],
			types: [] as string[],
		},
		pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
	},
	shared: {
		hiddenItems: { dlcs: toSet<TDlc>() },

		famousShop: false,
		popularTrend: { isNegative: false, tag: null } as IPopularTrend,
	},
};

export const ingredientsStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'page-ingredients-storage',
			version: storeVersion.availabilityDlcFilter,

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
						persistence: { filters },
					} = oldState;
					filters.types = [];
					filters.noTypes = [];
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
	availableTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return toArray<TIngredientTag[]>(
			instance.getValuesByProp(
				'tags',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			),
			DYNAMIC_TAG_MAP.popularNegative,
			DYNAMIC_TAG_MAP.popularPositive
		)
			.map(toGetValueCollection)
			.sort(pinyinSort);
	},
	availableTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return sortBy(
			instance.sortedTypes,
			instance.getValuesByProp(
				'type',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
		).map(toGetValueCollection);
	},
}));

ingredientsStore.shared.hiddenItems.dlcs.onChange(() => {
	ingredientsStore.persistence.filters.set({
		availabilityDlcs: [],
		contentDlcs: [],
		levels: [],
		noPlaces: [],
		noTags: [],
		noTypes: [],
		places: [],
		tags: [],
		types: [],
	});
});
