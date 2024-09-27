import {type Key} from 'react';
import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-normal/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-normal/beverageTabContent';
import {evaluateMeal} from '@/(pages)/customer-normal/evaluateMeal';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-normal/recipeTabContent';
import type {TCustomerRating, TRecipe, TTab} from '@/(pages)/customer-normal/types';
import {TrackCategory, trackEvent} from '@/components/analytics';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {IPersistenceState} from './types';
import {
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
	type TBeverageNames,
	type TCustomerNormalNames,
	type TIngredientNames,
	type TRecipeNames,
} from '@/data';
import type {TBeverageTag, TIngredientTag, TRecipeTag} from '@/data/types';
import {type IPopularData, type IRecipeData, type TPopularTag} from '@/stores';
import {getAllItemNames, keepLastTag, reverseDirection} from '@/stores/utils';
import {
	Beverage,
	Clothes,
	CustomerNormal,
	Ingredient,
	Recipe,
	numberSort,
	pinyinSort,
	removeLastElement,
	toValueObject,
	toValueWithKey,
} from '@/utils';

const instance_beverage = Beverage.getInstance();
const instance_clothes = Clothes.getInstance();
const instance_customer = CustomerNormal.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const storeVersion = {
	initial: 0,
	popular: 1,
	popularFull: 2, // eslint-disable-next-line sort-keys
	ingredientLevel: 3,
	rating: 4, // eslint-disable-next-line sort-keys
	extraCustomer: 5, // eslint-disable-next-line sort-keys
	dynamicMeal: 6,
	showCooker: 7,
	tableRows: 8, // eslint-disable-next-line sort-keys
	ingredientTag: 9,
	removeBeverage: 10, // eslint-disable-next-line sort-keys
	addBackBeverage: 11,
} as const;

const state = {
	instances: {
		beverage: instance_beverage,
		clothes: instance_clothes,
		customer: instance_customer,
		ingredient: instance_ingredient,
		recipe: instance_recipe,
	},

	beverage: {
		dlcs: instance_beverage.getValuesByProp(instance_beverage.data, 'dlc', true).sort(numberSort),
		names: instance_beverage.getValuesByProp(instance_beverage.data, 'name', true).sort(pinyinSort),
		tags: instance_beverage.sortedTags.map(toValueObject),
	},
	customer: {
		dlcs: instance_customer.getValuesByProp(instance_customer.data, 'dlc', true).sort(numberSort),
		places: instance_customer.getValuesByProp(instance_customer.data, 'places', true).sort(pinyinSort),
	},
	ingredient: {
		dlcs: instance_ingredient.getValuesByProp(instance_ingredient.data, 'dlc', true).sort(numberSort),
		levels: instance_ingredient
			.getValuesByProp(instance_ingredient.data, 'level', true)
			.filter(({value}) => !instance_ingredient.blockedLevels.has(value))
			.sort(numberSort),
		tags: (
			[
				...instance_ingredient
					.getValuesByProp(instance_ingredient.data, 'tags')
					.filter((tag) => !instance_ingredient.blockedTags.has(tag)),
				TAG_POPULAR_NEGATIVE,
				TAG_POPULAR_POSITIVE,
			] as TIngredientTag[]
		)
			.map(toValueObject)
			.sort(pinyinSort),
	},
	recipe: {
		cookers: instance_recipe.getValuesByProp(instance_recipe.data, 'cooker', true).sort(pinyinSort),
		dlcs: instance_recipe.getValuesByProp(instance_recipe.data, 'dlc', true).sort(numberSort),
		names: instance_recipe
			.getValuesByProp(instance_recipe.data, 'name', true)
			.filter(({value}) => !instance_recipe.blockedRecipes.has(value))
			.sort(pinyinSort),
		positiveTags: (
			[
				...instance_recipe
					.getValuesByProp(instance_recipe.data, 'positiveTags')
					.filter((tag) => !instance_recipe.blockedTags.has(tag)),
				TAG_POPULAR_NEGATIVE,
				TAG_POPULAR_POSITIVE,
			] as TRecipeTag[]
		)
			.map(toValueObject)
			.sort(pinyinSort),
	},

	persistence: {
		beverage: {
			table: {
				rows: 8,
				visibleColumns: beverageTableColumns.map(toValueWithKey('key')),
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
				tags: [] as string[], // eslint-disable-next-line sort-keys
				noTags: [] as string[], // eslint-disable-next-line sort-keys
				levels: [] as string[],
			},
			pinyinSortState: PinyinSortState.NONE,
			tabVisibility: TabVisibilityState.collapse,
		},
		recipe: {
			table: {
				rows: 8,
				visibleColumns: recipeTableColumns.filter(({key}) => key !== 'time').map(toValueWithKey('key')),
			},
		},

		meals: {} as {
			[key in TCustomerNormalNames]?: {
				index: number;
				beverage: TBeverageNames | null;
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
			selectableRows: [5, 8, 10, 15, 20].map(toValueObject),
			sortDescriptor: {} as TBeverageTableSortDescriptor,
		},
		customer: {
			name: null as TCustomerNormalNames | null,

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
			data: null as IRecipeData | null,

			cookers: new Set() as SelectionSet,
			dlcs: new Set() as SelectionSet,
			tagsWithPopular: [] as TRecipeTag[],

			page: 1,
			searchValue: '',
			selectableRows: [5, 8, 10, 15, 20].map(toValueObject),
			sortDescriptor: {} as TRecipeTableSortDescriptor,
		},
		tab: 'customer' as TTab,
	},
};

export type TCustomerNormalPersistenceState = IPersistenceState<(typeof state)['persistence']>;

export const customerNormalStoreKey = 'page-customer_normal-storage';

export const customerNormalStore = store(state, {
	persist: {
		enabled: true,
		name: customerNormalStoreKey,
		version: storeVersion.addBackBeverage,

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
				const {
					persistence: {
						ingredient: {filters},
					},
				} = oldState;
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
				const {
					persistence: {
						customer: {filters},
					},
				} = oldState;
				filters.includes = [];
				filters.excludes = [];
			}
			if (version < storeVersion.dynamicMeal) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						delete meal.popular;
						delete meal.rating;
					}
				}
			}
			if (version < storeVersion.showCooker) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {
						recipe: {
							table: {visibleColumns},
						},
					},
				} = oldState;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				if (!visibleColumns.includes('cooker')) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					visibleColumns.push('cooker');
				}
			}
			if (version < storeVersion.tableRows) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {
						beverage: {table: beverageTable},
						recipe: {table: recipeTable},
					},
				} = oldState;
				if (beverageTable.rows === 7) {
					beverageTable.rows = 8;
				}
				if (recipeTable.rows === 7) {
					recipeTable.rows = 8;
				}
			}
			if (version < storeVersion.ingredientTag) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {
						ingredient: {filters},
					},
				} = oldState;
				filters.tags = [];
				filters.noTags = [];
			}
			if (version < storeVersion.removeBeverage) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {persistence} = oldState;
				delete persistence.beverage;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(persistence.meals) as any) {
					for (const meal of meals) {
						delete meal.beverage;
					}
				}
			}
			if (version < storeVersion.addBackBeverage) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {persistence} = oldState;
				persistence.beverage = {
					table: {
						rows: 8,
						visibleColumns: ['action', 'beverage', 'price', 'suitability'],
					},
				};
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(persistence.meals) as any) {
					for (const meal of meals) {
						meal.beverage = null;
					}
				}
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
		customerNames: () =>
			getAllItemNames(instance_customer, currentStore.persistence.customer.pinyinSortState.use()),

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
				keepLastTag(prev, tag);
			});
		},
		onCustomerFilterRecipeTag(tag: TRecipeTag) {
			currentStore.shared.tab.set('recipe');
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.positiveTags.set((prev) => {
				keepLastTag(prev, tag);
			});
		},
		onCustomerSelectedChange(customerName: TCustomerNormalNames) {
			currentStore.shared.customer.name.set(customerName);
			trackEvent(TrackCategory.Select, 'Customer', customerName);
		},

		clearBeverageTableSearchValue() {
			currentStore.shared.beverage.searchValue.set('');
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableAction(beverageName: TBeverageNames) {
			currentStore.shared.beverage.name.set(beverageName);
			trackEvent(TrackCategory.Select, 'Beverage', beverageName);
		},
		onBeverageTablePageChange(page: number) {
			currentStore.shared.beverage.page.set(page);
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
		onBeverageTableSortChange(config: TBeverageTableSortDescriptor) {
			currentStore.shared.beverage.page.set(1);
			const sortConfig = config as Required<TBeverageTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn} = currentStore.shared.beverage.sortDescriptor.get();
			if (lastColumn === undefined || column !== lastColumn) {
				currentStore.shared.beverage.sortDescriptor.assign({
					column,
					lastColumn: column,
				});
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if ((column === 'price' || column === 'suitability') && column !== lastColumn) {
				reversedDirection = reverseDirection(direction);
			}
			currentStore.shared.beverage.sortDescriptor.assign({
				direction: reversedDirection,
			});
		},

		onIngredientSelectedChange(ingredientName: TIngredientNames) {
			const recipeData = currentStore.shared.recipe.data.get();
			let recipe: TRecipe | null = null;
			if (recipeData) {
				recipe = instance_recipe.getPropsByName(recipeData.name);
			}
			if (recipe === null) {
				return;
			}
			currentStore.shared.recipe.data.set((prev) => {
				if (prev && recipe.ingredients.length + prev.extraIngredients.length < 5) {
					prev.extraIngredients.push(ingredientName);
				}
			});
			trackEvent(TrackCategory.Select, 'Ingredient', ingredientName);
		},

		clearRecipeTableSearchValue() {
			currentStore.shared.recipe.searchValue.set('');
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableAction(recipeName: TRecipeNames) {
			currentStore.shared.recipe.data.set({
				extraIngredients: [],
				name: recipeName,
			});
			trackEvent(TrackCategory.Select, 'Recipe', recipeName);
		},
		onRecipeTablePageChange(page: number) {
			currentStore.shared.recipe.page.set(page);
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
		onRecipeTableSortChange(config: TRecipeTableSortDescriptor) {
			currentStore.shared.recipe.page.set(1);
			const sortConfig = config as Required<TRecipeTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn} = currentStore.shared.recipe.sortDescriptor.get();
			if (lastColumn === undefined || column !== lastColumn) {
				currentStore.shared.recipe.sortDescriptor.assign({
					column,
					lastColumn: column,
				});
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if ((column === 'price' || column === 'suitability') && column !== lastColumn) {
				reversedDirection = reverseDirection(direction);
			}
			currentStore.shared.recipe.sortDescriptor.assign({
				direction: reversedDirection,
			});
		},

		onTabSelectionChange(tab: Key) {
			currentStore.shared.tab.set(tab as TTab);
			currentStore.shared.customer.filterVisibility.set(tab === 'customer');
			currentStore.shared.ingredient.filterVisibility.set(tab === 'ingredient');
		},

		evaluateMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			if (customerName === null) {
				return;
			}
			const {positiveTags: customerPositiveTags} = instance_customer.getPropsByName(customerName);
			const customerPopularData = currentStore.shared.customer.popular.get();
			let extraIngredients: TIngredientNames[] = [];
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData) {
				extraIngredients = recipeData.extraIngredients;
			}
			const extraTags: TPopularTag[] = [];
			extraIngredients.forEach((ingredient) => {
				extraTags.push(...(instance_ingredient.getPropsByName(ingredient, 'tags') as TPopularTag[]));
			});
			let recipe: TRecipe | null = null;
			if (recipeData) {
				recipe = instance_recipe.getPropsByName(recipeData.name);
			}
			const rating = evaluateMeal({
				currentCustomerName: customerName,
				currentCustomerPopularData: customerPopularData,
				currentCustomerPositiveTags: customerPositiveTags,
				currentExtraIngredientsLength: extraIngredients.length,
				currentExtraTags: extraTags,
				currentRecipe: recipe,
			});
			currentStore.shared.customer.rating.set(rating);
		},
		evaluateSavedMealResult({
			extraIngredients,
			popular,
			recipeName,
		}: {
			customerName: TCustomerNormalNames;
			extraIngredients: TIngredientNames[];
			popular: IPopularData;
			recipeName: TRecipeNames;
		}) {
			const customerName = currentStore.shared.customer.name.get();
			if (customerName === null) {
				throw new ReferenceError('[stores/customer-normal/evaluateSavedMealResult]: `customerName` is null');
			}
			const extraTags: TPopularTag[] = [];
			extraIngredients.forEach((ingredient) => {
				extraTags.push(...(instance_ingredient.getPropsByName(ingredient, 'tags') as TPopularTag[]));
			});
			const rating = evaluateMeal({
				currentCustomerName: customerName,
				currentCustomerPopularData: popular,
				currentCustomerPositiveTags: instance_customer.getPropsByName(customerName, 'positiveTags'),
				currentExtraIngredientsLength: extraIngredients.length,
				currentExtraTags: extraTags,
				currentRecipe: instance_recipe.getPropsByName(recipeName),
			});
			return rating as TCustomerRating;
		},
		removeMealIngredient(ingredientName: TIngredientNames) {
			currentStore.shared.recipe.data.set((prev) => {
				if (prev) {
					prev.extraIngredients = removeLastElement(prev.extraIngredients, ingredientName);
				}
			});
			trackEvent(TrackCategory.Unselect, 'Ingredient', ingredientName);
		},
		saveMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			const beverageName = currentStore.shared.beverage.name.get();
			const recipeData = currentStore.shared.recipe.data.get();
			if (customerName === null || recipeData === null) {
				return;
			}
			const {extraIngredients, name: recipeName} = recipeData;
			const saveObject = {beverage: beverageName, extraIngredients, recipe: recipeName} as const;
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
				`${recipeName}${beverageName === null ? '' : ` - ${beverageName}`}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
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
		refreshCustomer() {
			currentStore.shared.customer.name.set(null);
			currentStore.shared.tab.set('customer');
			currentStore.shared.customer.filterVisibility.set(true);
			currentStore.shared.ingredient.filterVisibility.set(false);
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
			currentStore.persistence.customer.tabVisibility.set((prev) =>
				prev === TabVisibilityState.expand ? TabVisibilityState.collapse : TabVisibilityState.expand
			);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.persistence.ingredient.tabVisibility.set((prev) =>
				prev === TabVisibilityState.expand ? TabVisibilityState.collapse : TabVisibilityState.expand
			);
		},
	}));
