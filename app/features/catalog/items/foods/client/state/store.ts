import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import {
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	FOOD_COLLABORATION_SOURCE_FILTER,
	type TFoodSourceFilter,
	getFoodSourceFilterLabel,
} from '@/features/catalog/items/foods/sourceFilter';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import {
	FOODS_STORE_VERSION,
	migrateFoodsPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const instance = FoodCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();

const state = {
	instance,

	persistence: {
		filters: {
			availabilityDlcs: [] as string[],
			contentDlcs: [] as string[],
			cookerTypes: [] as TCookerTypeId[],
			ingredients: [] as TIngredientId[],
			levels: [] as string[],
			negativeTags: [] as TFoodTagId[],
			noIngredients: [] as TIngredientId[],
			noNegativeTags: [] as TFoodTagId[],
			noPlaces: [] as TFoodSourceFilter[],
			noPositiveTags: [] as TFoodTagId[],
			places: [] as TFoodSourceFilter[],
			positiveTags: [] as TFoodTagId[],
		},
		pinyinSortState: PINYIN_SORT_STATE_MAP.none as TPinyinSortState,
	},
	shared: {
		hiddenItems: { dlcs: new Set<TDlc>() },

		famousShop: false,
		popularTrend: { isNegative: false, tag: null } as IPopularTrend,
	},
};

const getNames = createNamesCache(instance);

function getVisibleRecipes(hiddenDlcs: ReadonlySet<TDlc>) {
	return filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
		.values()
		.flatMap(({ recipes }) => recipes.values());
}

export const foodsStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state>({
			migrate: (persistedState, version) =>
				migrateFoodsPersistedState(
					persistedState,
					version
				) as typeof state,
			name: 'page-recipes-storage',
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: FOODS_STORE_VERSION.recordIdentity,
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
	availableCookerTypes: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return [
			...new Set(
				getVisibleRecipes(hiddenDlcs).map(
					({ cookerType }) => cookerType
				)
			),
		]
			.map((value) => ({
				name: COOKER_TYPE_LABEL_MAP[value],
				recordId: cookerCatalog.getIdByTypeAndSeries(value, 0),
				value,
			}))
			.sort((a, b) => pinyinSort(a.name, b.name));
	},
	availableIngredients: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		return [
			...new Set(
				getVisibleRecipes(hiddenDlcs).flatMap(
					({ ingredients }) => ingredients
				)
			),
		]
			.map((value) => ({
				name: ingredientCatalog.getPropsById(value, 'name'),
				recordId: value,
				value,
			}))
			.sort((a, b) => pinyinSort(a.name, b.name));
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
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			)
			.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
			.map(toGetValueCollection);
	},
	availablePositiveTags: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const tags: TFoodTagId[] = [
			...instance.getValuesByProp(
				'positiveTags',
				false,
				filterAvailableItemsByHiddenDlcs(instance.data, hiddenDlcs)
			),
			DYNAMIC_FOOD_TAG_MAP.popularNegative,
			DYNAMIC_FOOD_TAG_MAP.popularPositive,
		];

		return tags
			.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
			.map((value): ValueCollection<TFoodTagId> => ({ value }));
	},
	availableSources: () => {
		const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
		const visibleFoods = filterAvailableItemsByHiddenDlcs(
			instance.data,
			hiddenDlcs
		);
		const sources = new Set<TFoodSourceFilter>(
			instance.getValuesByProp('maps', false, visibleFoods)
		);
		if (
			visibleFoods.some(
				({ isCollaborationSource }) => isCollaborationSource
			)
		) {
			sources.add(FOOD_COLLABORATION_SOURCE_FILTER);
		}

		return [...sources]
			.map((value) => ({ name: getFoodSourceFilterLabel(value), value }))
			.sort((a, b) => pinyinSort(a.name, b.name));
	},
}));

foodsStore.shared.hiddenItems.dlcs.onChange(() => {
	foodsStore.persistence.filters.set({
		availabilityDlcs: [],
		contentDlcs: [],
		cookerTypes: [],
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
