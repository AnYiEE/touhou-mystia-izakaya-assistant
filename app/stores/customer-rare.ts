import {type Key} from 'react';
import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@nextui-org/react';

import {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-rare/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {evaluateMeal} from '@/(pages)/customer-rare/evaluateMeal';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import type {ICurrentCustomer, TCustomerRating, TRecipe, TTab} from '@/(pages)/customer-rare/types';
import {TrackCategory, trackEvent} from '@/components/analytics';
import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {IPersistenceState} from './types';
import {type TBeverageNames, type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {type IPopularData} from '@/stores';
import {getAllItemNames, keepLastTag, reverseDirection} from '@/stores/utils';
import {
	Beverage,
	CustomerRare,
	CustomerSpecial,
	Ingredient,
	Recipe,
	numberSort,
	pinyinSort,
	removeLastElement,
	toValueObject,
	toValueWithKey,
	union,
} from '@/utils';

export interface ICustomerOrder {
	beverageTag: TBeverageTag | null;
	recipeTag: TRecipeTag | null;
}

const instance_beverage = Beverage.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();
const instance_rare = CustomerRare.getInstance();
const instance_special = CustomerSpecial.getInstance();

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
	linkedFilter: 9,
	mystiaCooker: 10, // eslint-disable-next-line sort-keys
	dynamicMeal: 11,
	tachie: 12,
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
		tags: instance_beverage.sortedTags.map(toValueObject),
	},
	customer: {
		dlcs: union(rareDlcs, specialDlcs).map(toValueObject),
		places: union(rarePlaces, specialPlaces).map(toValueObject),
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
			.map(toValueObject)
			.sort(pinyinSort) as {value: TRecipeTag}[],
	},

	persistence: {
		beverage: {
			table: {
				rows: 7,
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

			orderLinkedFilter: true,
			showTachie: true,
			showTagDescription: true,
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
					.map(toValueWithKey('key')),
			},
		},

		meals: {} as {
			[key in TCustomerNames]?: {
				index: number;
				hasMystiaCooker: boolean;
				order: ICustomerOrder;
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
			selectableRows: [5, 7, 10, 15, 20].map(toValueObject),
			sortDescriptor: {} as TBeverageTableSortDescriptor,
		},
		customer: {
			data: null as ICurrentCustomer | null,

			beverageTags: new Set() as SelectionSet,
			positiveTags: new Set() as SelectionSet,

			filterVisibility: true,

			hasMystiaCooker: false,
			order: {
				beverageTag: null,
				recipeTag: null,
			} as ICustomerOrder,
			popular: {
				isNegative: false,
				tag: null,
			} as IPopularData,
			rating: null as TCustomerRating | null,

			orderLinkedFilter: true,
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
			selectableRows: [5, 7, 10, 15, 20].map(toValueObject),
			sortDescriptor: {} as TRecipeTableSortDescriptor,
		},
		tab: 'customer' as TTab,
	},
};

export type TCustomerRarePersistenceState = IPersistenceState<(typeof state)['persistence']>;

export const customerRareStoreKey = 'page-customer_rare-storage';

export const customerRareStore = store(state, {
	persist: {
		enabled: true,
		name: customerRareStoreKey,
		version: storeVersion.tachie,

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
				const {
					persistence: {
						ingredient: {filters},
					},
				} = oldState;
				filters.levels = [];
			}
			if (version < storeVersion.tagDescription) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {customer},
				} = oldState;
				customer.showTagDescription = true;
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
			if (version < storeVersion.linkedFilter) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {customer},
				} = oldState;
				customer.orderLinkedFilter = true;
			}
			if (version < storeVersion.mystiaCooker) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						if (meal.hasMystiaCooker) {
							meal.order.beverageTag = null;
							meal.order.recipeTag = null;
						}
					}
				}
			}
			if (version < storeVersion.dynamicMeal) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.persistence.meals) as any) {
					for (const meal of meals) {
						delete meal.popular;
						delete meal.price;
						delete meal.rating;
					}
				}
			}
			if (version < storeVersion.tachie) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {customer},
				} = oldState;
				customer.showTachie = true;
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
		onCustomerFilterBeverageTag(tag: TBeverageTag, hasMystiaCooker: boolean) {
			currentStore.shared.tab.set('beverage');
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.beverageTags.set((prev) => {
				keepLastTag(prev, tag, {
					hasMystiaCooker,
					orderTag: currentStore.shared.customer.order.beverageTag.get(),
				});
			});
		},
		onCustomerFilterRecipeTag(tag: TRecipeTag, hasMystiaCooker: boolean) {
			currentStore.shared.tab.set('recipe');
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.positiveTags.set((prev) => {
				keepLastTag(prev, tag, {
					hasMystiaCooker,
					orderTag: currentStore.shared.customer.order.recipeTag.get(),
				});
			});
		},
		onCustomerOrderBeverageTag(tag: TBeverageTag) {
			currentStore.shared.customer.order.beverageTag.set((prev) => {
				if (prev === tag) {
					trackEvent(TrackCategory.Unselect, 'Customer Tag', tag);
					return null;
				}
				trackEvent(TrackCategory.Select, 'Customer Tag', tag);
				return tag;
			});
		},
		onCustomerOrderRecipeTag(tag: TRecipeTag) {
			currentStore.shared.customer.order.recipeTag.set((prev) => {
				if (prev === tag) {
					trackEvent(TrackCategory.Unselect, 'Customer Tag', tag);
					return null;
				}
				trackEvent(TrackCategory.Select, 'Customer Tag', tag);
				return tag;
			});
		},
		onCustomerSelectedChange(customerData: ICurrentCustomer) {
			currentStore.shared.customer.data.set(customerData);
			trackEvent(TrackCategory.Select, 'Customer', customerData.name);
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
			const sortConfig = config as Required<TBeverageTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn} = currentStore.shared.beverage.sortDescriptor.get();
			if (!lastColumn || column !== lastColumn) {
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
			if (!recipe) {
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
			const sortConfig = config as Required<TRecipeTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn} = currentStore.shared.recipe.sortDescriptor.get();
			if (!lastColumn || column !== lastColumn) {
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
			const customerData = currentStore.shared.customer.data.get();
			if (!customerData) {
				return;
			}
			const {name: customerName, target: customerTarget} = customerData;
			const instance_customer = (
				customerTarget === 'customer_rare' ? instance_rare : instance_special
			) as typeof instance_rare;
			const {
				beverageTags: customerBeverageTags,
				negativeTags: customerNegativeTags,
				positiveTags: customerPositiveTags,
			} = instance_customer.getPropsByName(customerName);
			const order = currentStore.shared.customer.order.get();
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			let beverageTags: TBeverageTag[] = [];
			const beverageName = currentStore.shared.beverage.name.get();
			if (beverageName) {
				const beverage = instance_beverage.getPropsByName(beverageName);
				beverageTags = beverage.tags;
			}
			let recipe: TRecipe | null = null;
			const ingredients: TIngredientNames[] = [];
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData) {
				const {extraIngredients, name: recipeName} = recipeData;
				recipe = instance_recipe.getPropsByName(recipeName);
				ingredients.push(...recipe.ingredients, ...extraIngredients);
			}
			const recipeTagsWithPopular = currentStore.shared.recipe.tagsWithPopular.get();
			const rating = evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags: customerNegativeTags,
				currentCustomerOrder: order,
				currentCustomerPositiveTags: customerPositiveTags,
				currentIngredients: ingredients,
				currentRecipe: recipe,
				currentRecipeTagsWithPopular: recipeTagsWithPopular,
				hasMystiaCooker,
			});
			currentStore.shared.customer.rating.set(rating);
		},
		evaluateSavedMealResult({
			beverageName,
			extraIngredients,
			hasMystiaCooker,
			order,
			popular,
			recipeName,
		}: {
			beverageName: TBeverageNames;
			extraIngredients: TIngredientNames[];
			hasMystiaCooker: boolean;
			order: ICustomerOrder;
			popular: IPopularData;
			recipeName: TRecipeNames;
		}) {
			const customerData = currentStore.shared.customer.data.get();
			if (!customerData) {
				throw new ReferenceError('[stores/customer-rare/evaluateSavedMealResult]: `customerData` is null');
			}
			const {name: customerName, target: customerTarget} = customerData;
			const instance_customer = (
				customerTarget === 'customer_rare' ? instance_rare : instance_special
			) as typeof instance_rare;
			const {
				beverageTags: customerBeverageTags,
				negativeTags: customerNegativeTags,
				positiveTags: customerPositiveTags,
			} = instance_customer.getPropsByName(customerName);
			const beverage = instance_beverage.getPropsByName(beverageName);
			const {tags: beverageTags, price: beveragePrice} = beverage;
			const recipe = instance_recipe.getPropsByName(recipeName);
			const {ingredients: originalIngredients, positiveTags: originalTags, price: recipePrice} = recipe;
			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
			);
			const composedRecipeTags = instance_recipe.composeTags(
				originalIngredients,
				extraIngredients,
				originalTags,
				extraTags
			);
			const rating = evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags: customerNegativeTags,
				currentCustomerOrder: order,
				currentCustomerPositiveTags: customerPositiveTags,
				currentIngredients: [...originalIngredients, ...extraIngredients],
				currentRecipe: recipe,
				currentRecipeTagsWithPopular: instance_recipe.calculateTagsWithPopular(composedRecipeTags, popular),
				hasMystiaCooker,
			});
			return {
				price: beveragePrice + recipePrice,
				rating: rating as TCustomerRating,
			};
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
			const customerName = currentStore.shared.customer.data.get()?.name;
			const beverageName = currentStore.shared.beverage.name.get();
			const recipeData = currentStore.shared.recipe.data.get();
			if (!customerName || !beverageName || !recipeData) {
				return;
			}
			const {extraIngredients, name: recipeName} = recipeData;
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			const order = currentStore.shared.customer.order.get();
			const saveObject = {
				beverage: beverageName,
				extraIngredients,
				hasMystiaCooker,
				order: hasMystiaCooker
					? {
							beverageTag: null,
							recipeTag: null,
						}
					: order,
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
		refreshCustomer() {
			currentStore.shared.customer.data.set(null);
			currentStore.shared.tab.set('customer');
			currentStore.shared.customer.filterVisibility.set(true);
			currentStore.shared.ingredient.filterVisibility.set(false);
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
			currentStore.persistence.customer.tabVisibility.set((prev) =>
				prev === TabVisibilityState.expand ? TabVisibilityState.collapse : TabVisibilityState.expand
			);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.persistence.ingredient.tabVisibility.set((prev) =>
				prev === TabVisibilityState.expand ? TabVisibilityState.collapse : TabVisibilityState.expand
			);
		},
		toggleMystiaCooker() {
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			currentStore.shared.customer.hasMystiaCooker.set(!hasMystiaCooker);
			trackEvent(hasMystiaCooker ? TrackCategory.Unselect : TrackCategory.Select, 'MystiaCooker');
		},
	}));
