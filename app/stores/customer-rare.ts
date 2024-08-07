import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-rare/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import type {ICurrentCustomer, TCustomerRating} from '@/(pages)/customer-rare/types';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {customerRareInstance as instance_rare, customerSpecialInstance as instance_special} from '@/methods/customer';
import {
	beverageInstance as instance_beverage,
	ingredientInstance as instance_ingredient,
	recipeInstance as instance_recipe,
} from '@/methods/food';
import {type IPopularData} from '@/stores';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort, union} from '@/utils';

const rareDlcs = instance_rare.getValuesByProp(instance_rare.data, 'dlc').sort(numberSort);
const rarePlaces = instance_rare.getValuesByProp(instance_rare.data, 'places').sort(pinyinSort);
const specialDlcs = instance_special.getValuesByProp(instance_special.data, 'dlc').sort(numberSort);
const specialPlaces = instance_special.getValuesByProp(instance_special.data, 'places').sort(pinyinSort);

const storeVersion = {
	initial: 0,
	rating: 1, // eslint-disable-next-line sort-keys
	popular: 2,
	popularTypo: 3,
	price: 4, // eslint-disable-next-line sort-keys
	cooker: 5,
	ingredientLevel: 6,
	tagDescription: 7, // eslint-disable-next-line sort-keys
	extraCustomer: 8,
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
		tags: instance_beverage.sortedTags.map((value) => ({value})),
	},
	customer: {
		dlcs: union(rareDlcs, specialDlcs).map((value) => ({value})),
		places: union(rarePlaces, specialPlaces).map((value) => ({value})),
	},
	ingredient: {
		dlcs: instance_ingredient.getValuesByProp(instance_ingredient.data, 'dlc', true).sort(numberSort),
		levels: instance_ingredient.getValuesByProp(instance_ingredient.data, 'level', true).sort(numberSort),
	},
	recipe: {
		cookers: instance_recipe.getValuesByProp(instance_recipe.data, 'cooker', true).sort(pinyinSort),
		dlcs: instance_recipe.getValuesByProp(instance_recipe.data, 'dlc', true).sort(numberSort),
		names: instance_recipe.getValuesByProp(instance_recipe.data, 'name', true).sort(pinyinSort),
		positiveTags: [...instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags'), '流行喜爱', '流行厌恶']
			.map((value) => ({value}))
			.sort(pinyinSort) as {value: TRecipeTag}[],
	},

	persistence: {
		beverage: {
			table: {
				rows: 7,
				visibleColumns: beverageTableColumns.map(({key}) => key),
			},
		},
		customer: {
			filters: {
				dlcs: [] as string[],
				places: [] as string[], // eslint-disable-next-line sort-keys
				noPlaces: [] as string[], // eslint-disable-next-line sort-keys
				includes: [] as string[], // eslint-disable-next-line sort-keys
				excludes: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			searchValue: '',
			showTagDescription: true,
			tabVisibility: TabVisibilityState.collapse,
		},
		ingredient: {
			filters: {
				dlcs: [] as string[],
				levels: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			tabVisibility: TabVisibilityState.collapse,
		},
		recipe: {
			table: {
				rows: 7,
				visibleColumns: recipeTableColumns
					.filter(({key}) => !['cooker', 'time'].includes(key))
					.map(({key}) => key),
			},
		},

		meals: {} as {
			[key in TCustomerNames]?: {
				index: number;
				hasMystiaCooker: boolean;
				order: {
					beverageTag: TBeverageTag | null;
					recipeTag: TRecipeTag | null;
				};
				popular: IPopularData;
				rating: TCustomerRating;
				beverage: TBeverageNames;
				recipe: TRecipeNames;
				extraIngredients: TIngredientNames[];
				price: number;
			}[];
		},
	},
	shared: {
		beverage: {
			name: null as TBeverageNames | null,

			dlcs: new Set() as SelectionSet,
			page: 1,
			searchValue: '',
			selectableRows: [5, 7, 10, 15, 20].map((value) => ({value})),
			sortDescriptor: {} as TBeverageTableSortDescriptor,
		},
		customer: {
			data: null as ICurrentCustomer | null,

			beverageTags: new Set() as SelectionSet,
			positiveTags: new Set() as SelectionSet,

			filterVisibility: true,

			hasMystiaCooker: false,
			order: {
				beverageTag: null as TBeverageTag | null,
				recipeTag: null as TRecipeTag | null,
			},
			popular: {
				isNegative: false,
				tag: null,
			} as IPopularData,
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

			cookers: new Set() as SelectionSet,
			dlcs: new Set() as SelectionSet,
			tagsWithPopular: [] as TRecipeTag[],

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
		version: storeVersion.extraCustomer,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.rating) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.page.selected) as any) {
					for (const meal of meals) {
						meal.rating = '完美';
					}
				}
			}
			if (version < storeVersion.popular) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence = oldState.page;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.selected) as any) {
					for (const meal of meals) {
						meal.hasMystiaKitchenware = false;
						meal.order = {
							beverageTag: null,
							recipeTag: null,
						};
						meal.popular = {
							isNegative: false,
							tag: null,
						};
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence.meals = oldState.page.selected;
				delete oldState.persistence.selected;
				delete oldState.page;
			}
			if (version < storeVersion.popularTypo) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						meal.hasMystiaKitchenware = meal.hasMystiaKitchenwware;
						// cSpell:ignore kitchenwware
						delete meal.hasMystiaKitchenwware;
					}
				}
			}
			if (version < storeVersion.price) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						meal.price = 0;
					}
				}
			}
			if (version < storeVersion.cooker) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						meal.hasMystiaCooker = meal.hasMystiaKitchenware;
						delete meal.hasMystiaKitchenware;
					}
				}
			}
			if (version < storeVersion.ingredientLevel) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {filters} = oldState.persistence.ingredient;
				filters.levels = [];
			}
			if (version < storeVersion.tagDescription) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {customer} = oldState.persistence;
				customer.showTagDescription = true;
			}
			if (version < storeVersion.extraCustomer) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {filters} = oldState.persistence.customer;
				filters.includes = [];
				filters.excludes = [];
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
})
	.computed((currentStore) => ({
		rareNames: () => getAllItemNames(instance_rare, currentStore.persistence.customer.pinyinSortState.use()),
		specialNames: () => getAllItemNames(instance_special, currentStore.persistence.customer.pinyinSortState.use()),

		beverageTableColumns: {
			read: () => new Set(currentStore.persistence.beverage.table.visibleColumns.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.beverage.table.visibleColumns.set([...columns] as never);
			},
		},
		beverageTableRows: {
			read: () => new Set([currentStore.persistence.beverage.table.rows.use().toString()]) as SelectionSet,
			write: (rows: Selection) => {
				currentStore.persistence.beverage.table.rows.set(Number.parseInt([...rows][0] as string));
			},
		},
		recipeTableColumns: {
			read: () => new Set(currentStore.persistence.recipe.table.visibleColumns.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.recipe.table.visibleColumns.set([...columns] as never);
			},
		},
		recipeTableRows: {
			read: () => new Set([currentStore.persistence.recipe.table.rows.use().toString()]) as SelectionSet,
			write: (rows: Selection) => {
				currentStore.persistence.recipe.table.rows.set(Number.parseInt([...rows][0] as string));
			},
		},
	}))
	.actions((currentStore) => ({
		refreshAllSelectedItems() {
			currentStore.shared.recipe.cookers.set(new Set());
			currentStore.shared.recipe.dlcs.set(new Set());
			currentStore.shared.recipe.searchValue.set('');
			currentStore.shared.recipe.sortDescriptor.set({});
			currentStore.shared.beverage.dlcs.set(new Set());
			currentStore.shared.beverage.searchValue.set('');
			currentStore.shared.beverage.sortDescriptor.set({});
		},
		refreshCustomerSelectedItems() {
			currentStore.shared.customer.beverageTags.set(new Set());
			currentStore.shared.customer.positiveTags.set(new Set());
			currentStore.shared.customer.hasMystiaCooker.set(false);
			currentStore.shared.customer.order.set({
				beverageTag: null,
				recipeTag: null,
			});
			currentStore.shared.customer.rating.set(null);
			currentStore.shared.recipe.data.set(null);
			currentStore.shared.recipe.tagsWithPopular.set([]);
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.beverage.name.set(null);
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.ingredient.filterVisibility.set(false);
			if (currentStore.shared.tab.get() === 'ingredient') {
				if (currentStore.shared.customer.data.get()) {
					currentStore.shared.tab.set('recipe');
				} else {
					currentStore.shared.tab.set('customer');
				}
			}
		},
		toggleCustomerTabVisibilityState() {
			currentStore.persistence.customer.tabVisibility.set(
				currentStore.persistence.customer.tabVisibility.get() === TabVisibilityState.expand
					? TabVisibilityState.collapse
					: TabVisibilityState.expand
			);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.persistence.ingredient.tabVisibility.set(
				currentStore.persistence.ingredient.tabVisibility.get() === TabVisibilityState.expand
					? TabVisibilityState.collapse
					: TabVisibilityState.expand
			);
		},
	}));

export const {Provider: CustomerRareStoreProvider, useStore: useCustomerRareStore} =
	createStoreContext(customerRareStore);
