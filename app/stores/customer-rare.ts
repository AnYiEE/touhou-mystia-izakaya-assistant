import {store, createStoreContext} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {beverageTableColumns, recipeTableColumns, CustomerTabVisibilityState} from '@/(pages)/customer-rare/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import type {ICurrentCustomer, TBeverage, TRecipe} from '@/(pages)/customer-rare/types';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import {instances} from '@/methods';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort} from '@/utils';

const {
	customer: {customer_rare: instance_rare, customer_special: instance_special},
} = instances;

const rareDlcs = instance_rare.getValuesByProp(instance_rare.data, 'dlc').sort(numberSort);
const rarePlaces = instance_rare.getValuesByProp(instance_rare.data, 'places').sort(pinyinSort);
const specialDlcs = instance_special.getValuesByProp(instance_special.data, 'dlc').sort(numberSort);
const specialPlaces = instance_special.getValuesByProp(instance_special.data, 'places').sort(pinyinSort);

const customerRareStore = store(
	{
		instances: {
			customer_rare: instance_rare,
			customer_special: instance_special,
		},
		customer: {
			dlcs: [...new Set([...rareDlcs, ...specialDlcs])].map((value) => ({value})),
			places: [...new Set([...rarePlaces, ...specialPlaces])].map((value) => ({value})),
		},
		page: {
			customer: {
				filters: {
					dlcs: [] as string[],
					places: [] as string[],
					noPlaces: [] as string[],
				},
				tabVisibility: CustomerTabVisibilityState.collapse,
				pinyinSortState: PinyinSortState.NONE,
				searchValue: '',
			},
			recipe: {
				table: {
					rows: 7,
					visibleColumns: recipeTableColumns.filter(({key}) => key !== 'kitchenware').map(({key}) => key),
				},
			},
			beverage: {
				table: {
					rows: 7,
					visibleColumns: beverageTableColumns.map(({key}) => key),
				},
			},
			selected: {} as {
				[key in TCustomerNames]: {
					index: number;
					recipe: TRecipeNames;
					beverage: TBeverageNames;
					ingredients: {index: number; name: TIngredientNames; removeable: boolean}[];
				}[];
			},
		},
		share: {
			customer: {
				data: null as ICurrentCustomer | null,
				beverageTags: new Set() as Selection,
				positiveTags: new Set() as Selection,
			},
			recipe: {
				data: null as TRecipe | null,
				kitchenwares: new Set() as Selection,
				page: 1,
				searchValue: '',
				sortDescriptor: {} as TRecipeTableSortDescriptor,
			},
			beverage: {
				data: null as TBeverage | null,
				page: 1,
				searchValue: '',
				sortDescriptor: {} as TBeverageTableSortDescriptor,
			},
			selected: {
				recipe: null as TRecipeNames | null,
				beverage: null as TBeverageNames | null,
				ingredients: null as {index: number; name: TIngredientNames; removeable: boolean}[] | null,
			},
		},
	},
	{
		persist: {
			enabled: true,
			name: 'page-customer_rare-storage',
			storage: createJSONStorage(() => localStorage),
			partialize(store) {
				return {
					page: store.page,
				} as typeof store;
			},
		},
	}
)
	.computed((store) => ({
		rareNames: () => getAllItemNames(instance_rare, store.page.customer.pinyinSortState.get()),
		specialNames: () => getAllItemNames(instance_special, store.page.customer.pinyinSortState.get()),
		recipeTableColumns: {
			read: () => new Set(store.page.recipe.table.visibleColumns.use()) as Selection,
			write: (columns: Selection) => store.page.recipe.table.visibleColumns.set([...columns] as never),
		},
		beverageTableColumns: {
			read: () => new Set(store.page.beverage.table.visibleColumns.use()) as Selection,
			write: (columns: Selection) => store.page.beverage.table.visibleColumns.set([...columns] as never),
		},
	}))
	.actions((store) => ({
		toggleCustomerTabVisibilityState() {
			store.page.customer.tabVisibility.set(
				store.page.customer.tabVisibility.get() === CustomerTabVisibilityState.expand
					? CustomerTabVisibilityState.collapse
					: CustomerTabVisibilityState.expand
			);
		},
		refreshCustomerSelectedItems() {
			store.share.customer.beverageTags.set(new Set());
			store.share.customer.positiveTags.set(new Set());
			store.share.recipe.data.set(null);
			store.share.recipe.page.set(1);
			store.share.beverage.data.set(null);
			store.share.beverage.page.set(1);
		},
		refreshAllSelectedItems() {
			store.share.recipe.kitchenwares.set(new Set());
			store.share.recipe.searchValue.set('');
			store.share.recipe.sortDescriptor.set({});
			store.share.beverage.searchValue.set('');
			store.share.beverage.sortDescriptor.set({});
		},
	}));

export const {Provider: CustomerRareStoreProvider, useStore: useCustomerRareStore} =
	createStoreContext(customerRareStore);
