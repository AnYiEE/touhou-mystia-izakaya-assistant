import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-normal/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-normal/beverageTabContent';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-normal/recipeTabContent';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import {customerNormalInstance as instance_customer} from '@/methods/customer';
import {
	beverageInstance as instance_beverage,
	ingredientInstance as instance_ingredient,
	recipeInstance as instance_recipe,
} from '@/methods/food';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const customerNormalStore = store(
	{
		instances: {
			beverage: instance_beverage,
			customer: instance_customer,
			ingredient: instance_ingredient,
			recipe: instance_recipe,
		},

		beverage: {
			dlcs: instance_beverage.getValuesByProp(instance_beverage.data, 'dlc', true).sort(numberSort),
			names: instance_beverage.getValuesByProp(instance_beverage.data, 'name', true).sort(pinyinSort),
			tags: instance_beverage.sortedTag.map((value) => ({value})),
		},
		customer: {
			dlcs: instance_customer.getValuesByProp(instance_customer.data, 'dlc', true).sort(numberSort),
			places: instance_customer.getValuesByProp(instance_customer.data, 'places', true).sort(pinyinSort),
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
				name: null as TCustomerNames | null,

				beverageTags: new Set() as Selection,
				positiveTags: new Set() as Selection,

				filterVisibility: true,
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
	},
	{
		persist: {
			enabled: true,
			name: 'page-customer_normal-storage',
			partialize(currentStore) {
				return {
					page: currentStore.page,
				} as typeof currentStore;
			},
			storage: createJSONStorage(() => localStorage),
		},
	}
)
	.computed((currentStore) => ({
		names: () => getAllItemNames(instance_customer, currentStore.page.customer.pinyinSortState.get()),

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
			currentStore.share.customer.beverageTags.set(new Set());
			currentStore.share.customer.positiveTags.set(new Set());
			currentStore.share.recipe.data.set(null);
			currentStore.share.recipe.page.set(1);
			currentStore.share.beverage.name.set(null);
			currentStore.share.beverage.page.set(1);
			currentStore.share.ingredient.filterVisibility.set(false);
			if (currentStore.share.tab.get() === 'ingredient') {
				if (currentStore.share.customer.name.get()) {
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

export const {Provider: CustomerNormalStoreProvider, useStore: useCustomerNormalStore} =
	createStoreContext(customerNormalStore);
