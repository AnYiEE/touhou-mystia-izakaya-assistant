import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';
import {union} from 'lodash';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-rare/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import type {ICurrentCustomer, TCustomerRating} from '@/(pages)/customer-rare/types';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import {customerRareInstance as instance_rare, customerSpecialInstance as instance_special} from '@/methods/customer';
import {
	beverageInstance as instance_beverage,
	ingredientInstance as instance_ingredient,
	recipeInstance as instance_recipe,
} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const rareDlcs = instance_rare.getValuesByProp(instance_rare.data, 'dlc').sort(numberSort);
const rarePlaces = instance_rare.getValuesByProp(instance_rare.data, 'places').sort(pinyinSort);
const specialDlcs = instance_special.getValuesByProp(instance_special.data, 'dlc').sort(numberSort);
const specialPlaces = instance_special.getValuesByProp(instance_special.data, 'places').sort(pinyinSort);

const storeVersion = {
	initial: 0,
	rating: 1,
} as const;

const state = {
	instances: {
		beverage: instance_beverage,
		customer_rare: instance_rare,
		customer_special: instance_special,
		ingredient: instance_ingredient,
		recipe: instance_recipe,
	},

	beverage: {
		dlcs: instance_beverage.getValuesByProp(instance_beverage.data, 'dlc', true).sort(numberSort),
		names: instance_beverage.getValuesByProp(instance_beverage.data, 'name', true).sort(pinyinSort),
		tags: instance_beverage.sortedTag.map((value) => ({value})),
	},
	customer: {
		dlcs: union(rareDlcs, specialDlcs).map((value) => ({value})),
		places: union(rarePlaces, specialPlaces).map((value) => ({value})),
	},
	ingredient: {
		dlcs: instance_ingredient.getValuesByProp(instance_ingredient.data, 'dlc', true).sort(numberSort),
	},
	recipe: {
		dlcs: instance_recipe.getValuesByProp(instance_recipe.data, 'dlc', true).sort(numberSort),
		kitchenwares: instance_recipe.getValuesByProp(instance_recipe.data, 'kitchenware', true).sort(pinyinSort),
		names: instance_recipe.getValuesByProp(instance_recipe.data, 'name', true).sort(pinyinSort),
		negativeTags: instance_recipe.getValuesByProp(instance_recipe.data, 'negativeTags', true).sort(pinyinSort),
		positiveTags: instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags', true).sort(pinyinSort),
	},

	page: {
		beverage: {
			table: {
				rows: 7,
				visibleColumns: beverageTableColumns.map(({key}) => key),
			},
		},
		customer: {
			filters: {
				dlcs: [] as string[],
				noPlaces: [] as string[],
				places: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
			tabVisibility: TabVisibilityState.collapse,
		},
		ingredient: {
			filters: {
				dlcs: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			tabVisibility: TabVisibilityState.collapse,
		},
		recipe: {
			table: {
				rows: 7,
				visibleColumns: recipeTableColumns.filter(({key}) => key !== 'kitchenware').map(({key}) => key),
			},
		},
		selected: {} as {
			[key in TCustomerNames]?: {
				index: number;
				rating: TCustomerRating;
				beverage: TBeverageNames;
				recipe: TRecipeNames;
				extraIngredients: TIngredientNames[];
			}[];
		},
	},
	share: {
		beverage: {
			name: null as TBeverageNames | null,

			dlcs: new Set() as Selection,
			page: 1,
			searchValue: '',
			selectableRows: [5, 7, 10, 15, 20].map((value) => ({value})),
			sortDescriptor: {} as TBeverageTableSortDescriptor,
		},
		customer: {
			data: null as ICurrentCustomer | null,

			beverageTags: new Set() as Selection,
			positiveTags: new Set() as Selection,

			filterVisibility: true,
			rating: null as TCustomerRating | null,
		},
		ingredient: {
			filterVisibility: false,
		},
		recipe: {
			data: null as {
				name: TRecipeNames;
				extraIngredients: TIngredientNames[];
			} | null,

			dlcs: new Set() as Selection,
			kitchenwares: new Set() as Selection,
			page: 1,
			searchValue: '',
			selectableRows: [5, 7, 10, 15, 20].map((value) => ({value})),
			sortDescriptor: {} as TRecipeTableSortDescriptor,
		},
		tab: 'customer' as string | number,
	},
};

const customerRareStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-customer_rare-storage',
		version: storeVersion.rating,

		migrate(persistedState, version) {
			if (version < storeVersion.rating) {
				const oldState = persistedState as typeof state;
				for (const meals of Object.values(oldState.page.selected)) {
					for (const meal of meals) {
						meal.rating = '完美';
					}
				}
			}
			return persistedState as typeof state;
		},
		partialize(currentStore) {
			return {
				page: currentStore.page,
			} as typeof currentStore;
		},
		storage: createJSONStorage(() => localStorage),
	},
})
	.computed((currentStore) => ({
		rareNames: () => getAllItemNames(instance_rare, currentStore.page.customer.pinyinSortState.get()),
		specialNames: () => getAllItemNames(instance_special, currentStore.page.customer.pinyinSortState.get()),

		beverageTableColumns: {
			read: () => new Set(currentStore.page.beverage.table.visibleColumns.use()) as Selection,
			write: (columns: Selection) => {
				currentStore.page.beverage.table.visibleColumns.set([...columns] as never);
			},
		},
		beverageTableRows: {
			read: () => new Set([currentStore.page.beverage.table.rows.use().toString()]) as Selection,
			write: (columns: Selection) => {
				currentStore.page.beverage.table.rows.set(Number.parseInt([...columns][0] as string));
			},
		},
		recipeTableColumns: {
			read: () => new Set(currentStore.page.recipe.table.visibleColumns.use()) as Selection,
			write: (columns: Selection) => {
				currentStore.page.recipe.table.visibleColumns.set([...columns] as never);
			},
		},
		recipeTableRows: {
			read: () => new Set([currentStore.page.recipe.table.rows.use().toString()]) as Selection,
			write: (columns: Selection) => {
				currentStore.page.recipe.table.rows.set(Number.parseInt([...columns][0] as string));
			},
		},
	}))
	.actions((currentStore) => ({
		refreshAllSelectedItems() {
			currentStore.share.recipe.dlcs.set(new Set());
			currentStore.share.recipe.kitchenwares.set(new Set());
			currentStore.share.recipe.searchValue.set('');
			currentStore.share.recipe.sortDescriptor.set({});
			currentStore.share.beverage.dlcs.set(new Set());
			currentStore.share.beverage.searchValue.set('');
			currentStore.share.beverage.sortDescriptor.set({});
		},
		refreshCustomerSelectedItems() {
			currentStore.share.customer.rating.set(null);
			currentStore.share.customer.beverageTags.set(new Set());
			currentStore.share.customer.positiveTags.set(new Set());
			currentStore.share.recipe.data.set(null);
			currentStore.share.recipe.page.set(1);
			currentStore.share.beverage.name.set(null);
			currentStore.share.beverage.page.set(1);
			currentStore.share.ingredient.filterVisibility.set(false);
			if (currentStore.share.tab.get() === 'ingredient') {
				if (currentStore.share.customer.data.get()) {
					currentStore.share.tab.set('recipe');
				} else {
					currentStore.share.tab.set('customer');
				}
			}
		},
		toggleCustomerTabVisibilityState() {
			currentStore.page.customer.tabVisibility.set(
				currentStore.page.customer.tabVisibility.get() === TabVisibilityState.expand
					? TabVisibilityState.collapse
					: TabVisibilityState.expand
			);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.page.ingredient.tabVisibility.set(
				currentStore.page.ingredient.tabVisibility.get() === TabVisibilityState.expand
					? TabVisibilityState.collapse
					: TabVisibilityState.expand
			);
		},
	}));

export const {Provider: CustomerRareStoreProvider, useStore: useCustomerRareStore} =
	createStoreContext(customerRareStore);
