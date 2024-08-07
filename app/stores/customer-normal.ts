import {type Key} from 'react';
import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-normal/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-normal/beverageTabContent';
import {evaluateMeal} from '@/(pages)/customer-normal/evaluateMeal';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-normal/recipeTabContent';
import type {TCustomerRating, TRecipe} from '@/(pages)/customer-normal/types';
import {TrackCategory, trackEvent} from '@/components/analytics';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {customerNormalInstance as instance_customer} from '@/methods/customer';
import {
	beverageInstance as instance_beverage,
	ingredientInstance as instance_ingredient,
	recipeInstance as instance_recipe,
} from '@/methods/food';
import {type IPopularData, type TPopularTag} from '@/stores';
import {getAllItemNames} from '@/stores/utils';
import {numberSort, pinyinSort, removeLastElement} from '@/utils';

const storeVersion = {
	initial: 0,
	popular: 1,
	popularFull: 2, // eslint-disable-next-line sort-keys
	ingredientLevel: 3,
	rating: 4, // eslint-disable-next-line sort-keys
	extraCustomer: 5,
} as const;

const state = {
	instances: {
		beverage: instance_beverage,
		customer: instance_customer,
		ingredient: instance_ingredient,
		recipe: instance_recipe,
	},

	beverage: {
		dlcs: instance_beverage.getValuesByProp(instance_beverage.data, 'dlc', true).sort(numberSort),
		names: instance_beverage.getValuesByProp(instance_beverage.data, 'name', true).sort(pinyinSort),
		tags: instance_beverage.sortedTags.map((value) => ({value})),
	},
	customer: {
		dlcs: instance_customer.getValuesByProp(instance_customer.data, 'dlc', true).sort(numberSort),
		places: instance_customer.getValuesByProp(instance_customer.data, 'places', true).sort(pinyinSort),
	},
	ingredient: {
		dlcs: instance_ingredient.getValuesByProp(instance_ingredient.data, 'dlc', true).sort(numberSort),
		levels: instance_ingredient.getValuesByProp(instance_ingredient.data, 'level', true).sort(numberSort),
	},
	recipe: {
		cookers: instance_recipe.getValuesByProp(instance_recipe.data, 'cooker', true).sort(pinyinSort),
		dlcs: instance_recipe.getValuesByProp(instance_recipe.data, 'dlc', true).sort(numberSort),
		names: instance_recipe.getValuesByProp(instance_recipe.data, 'name', true).sort(pinyinSort),
		positiveTags: instance_recipe.getValuesByProp(instance_recipe.data, 'positiveTags', true).sort(pinyinSort),
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
				popular: IPopularData;
				rating: TCustomerRating;
				beverage: TBeverageNames;
				recipe: TRecipeNames;
				extraIngredients: TIngredientNames[];
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
			name: null as TCustomerNames | null,

			beverageTags: new Set() as SelectionSet,
			positiveTags: new Set() as SelectionSet,

			filterVisibility: true,

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

const customerNormalStore = store(state, {
	persist: {
		enabled: true,
		name: 'page-customer_normal-storage',
		version: storeVersion.extraCustomer,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.popular) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence = oldState.page;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				oldState.persistence.meals = oldState.page.selected;
				delete oldState.persistence.selected;
				delete oldState.page;
			}
			if (version < storeVersion.popularFull) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						meal.popular = {
							isNegative: false,
							tag: null,
						};
					}
				}
			}
			if (version < storeVersion.ingredientLevel) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {filters} = oldState.persistence.ingredient;
				filters.levels = [];
			}
			if (version < storeVersion.rating) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						meal.rating = '普通';
					}
				}
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
		names: () => getAllItemNames(instance_customer, currentStore.persistence.customer.pinyinSortState.use()),

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
		onCustomerFilterBeverageTag(tag: TBeverageTag) {
			currentStore.shared.tab.set('beverage');
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.beverageTags.set((prev) => {
				if (prev.has(tag)) {
					prev.delete(tag);
				} else {
					prev.add(tag);
				}
			});
		},
		onCustomerFilterRecipeTag(tag: TRecipeTag) {
			currentStore.shared.tab.set('recipe');
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.positiveTags.set((prev) => {
				if (prev.has(tag)) {
					prev.delete(tag);
				} else {
					prev.add(tag);
				}
			});
		},
		onCustomerSelectedChange(customer: TCustomerNames) {
			currentStore.shared.customer.name.set(customer);
			trackEvent(TrackCategory.Select, 'Customer', customer);
		},

		clearBeverageTableSearchValue() {
			currentStore.shared.beverage.searchValue.set('');
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableRowsPerPageChange(rows: Selection) {
			currentStore.beverageTableRows.set(rows);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSearchValueChange(value: Key | null) {
			if (value) {
				currentStore.shared.beverage.searchValue.set(value as string);
				currentStore.shared.beverage.page.set(1);
			} else {
				currentStore.shared.beverage.searchValue.set('');
			}
		},
		onBeverageTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.shared.beverage.dlcs.set(dlcs as SelectionSet);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSelectedTagsChange(tags: Selection) {
			currentStore.shared.customer.beverageTags.set(tags as SelectionSet);
			currentStore.shared.beverage.page.set(1);
		},

		clearRecipeTableSearchValue() {
			currentStore.shared.recipe.searchValue.set('');
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableRowsPerPageChange(rows: Selection) {
			currentStore.recipeTableRows.set(rows);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSearchValueChange(value: Key | null) {
			if (value) {
				currentStore.shared.recipe.searchValue.set(value as string);
				currentStore.shared.recipe.page.set(1);
			} else {
				currentStore.shared.recipe.searchValue.set('');
			}
		},
		onRecipeTableSelectedCookersChange(cookers: Selection) {
			currentStore.shared.recipe.cookers.set(cookers as SelectionSet);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.shared.recipe.dlcs.set(dlcs as SelectionSet);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSelectedPositiveTagsChange(tags: Selection) {
			currentStore.shared.customer.positiveTags.set(tags as SelectionSet);
			currentStore.shared.recipe.page.set(1);
		},

		evaluateMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			if (!customerName) {
				return;
			}
			const {positiveTags: customerPositiveTags} = instance_customer.getPropsByName(customerName);
			const customerPopularData = currentStore.shared.customer.popular.get();
			const beverageName = currentStore.shared.beverage.name.get();
			let extraIngredients: TIngredientNames[] = [];
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData) {
				extraIngredients = recipeData.extraIngredients;
			}
			const extraTags: TPopularTag[] = [];
			extraIngredients.forEach((ingredient) => {
				extraTags.push(...instance_ingredient.getPropsByName(ingredient).tags);
			});
			let recipe: TRecipe | null = null;
			if (recipeData) {
				recipe = instance_recipe.getPropsByName(recipeData.name);
			}
			const rating = evaluateMeal({
				currentBeverageName: beverageName,
				currentCustomerPopularData: customerPopularData,
				currentCustomerPositiveTags: customerPositiveTags,
				currentExtraIngredientsLength: extraIngredients.length,
				currentExtraTags: extraTags,
				currentRecipe: recipe,
			});
			currentStore.shared.customer.rating.set(rating);
		},
		removeMealIngredient(ingredient: TIngredientNames) {
			currentStore.shared.recipe.data.set((prev) => {
				if (prev) {
					prev.extraIngredients = removeLastElement(prev.extraIngredients, ingredient);
				}
			});
			trackEvent(TrackCategory.Unselect, 'Ingredient', ingredient);
		},
		saveMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			const beverageName = currentStore.shared.beverage.name.get();
			const recipe = currentStore.shared.recipe.data.get();
			const rating = currentStore.shared.customer.rating.get();
			if (!customerName || !beverageName || !recipe || !rating) {
				return;
			}
			const {extraIngredients, name: recipeName} = recipe;
			const popular = currentStore.shared.customer.popular.get();
			const saveObject = {
				beverage: beverageName,
				extraIngredients,
				popular,
				rating,
				recipe: recipeName,
			} as const;
			currentStore.persistence.meals.set((prev) => {
				if (customerName in prev) {
					const lastItem = prev[customerName]?.at(-1);
					const index = lastItem ? lastItem.index + 1 : 0;
					prev[customerName]?.push({...saveObject, index});
				} else {
					prev[customerName] = [{...saveObject, index: 0}];
				}
			});
			trackEvent(
				TrackCategory.Click,
				'Save Button',
				`${recipeName} - ${beverageName}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
			);
		},

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
			currentStore.shared.customer.rating.set(null);
			currentStore.shared.recipe.data.set(null);
			currentStore.shared.recipe.tagsWithPopular.set([]);
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.beverage.name.set(null);
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.ingredient.filterVisibility.set(false);
			if (currentStore.shared.tab.get() === 'ingredient') {
				if (currentStore.shared.customer.name.get()) {
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

export const {Provider: CustomerNormalStoreProvider, useStore: useCustomerNormalStore} =
	createStoreContext(customerNormalStore);
