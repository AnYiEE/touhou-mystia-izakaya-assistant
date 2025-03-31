import {type Key} from 'react';
import {store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type Selection} from '@heroui/table';

import {beverageTableColumns, recipeTableColumns, tabVisibilityStateMap} from '@/(pages)/customer-rare/constants';
import {type TTableSortDescriptor as TBeverageTableSortDescriptor} from '@/(pages)/customer-rare/beverageTabContent';
import {type TTableSortDescriptor as TRecipeTableSortDescriptor} from '@/(pages)/customer-rare/recipeTabContent';
import type {TTab, TTabVisibilityState} from '@/(pages)/customer-rare/types';
import {trackEvent} from '@/components/analytics';
import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import type {IPersistenceState} from './types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCustomerRareName,
	type TIngredientName,
	type TIngredientTag,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import {createNamesCache, keepLastTag, reverseDirection, reverseVisibilityState} from '@/stores/utils';
import type {IMealRecipe, IPopularTrend} from '@/types';
import {
	checkEmpty,
	generateRange,
	numberSort,
	pinyinSort,
	removeLastElement,
	toArray,
	toGetItemWithKey,
	toGetValueCollection,
	toSet,
	union,
} from '@/utilities';
import {Beverage, Clothes, Cooker, CustomerRare, Ingredient, Ornament, Partner, Recipe} from '@/utils';
import type {TRecipe} from '@/utils/types';

export interface ICustomerOrder {
	beverageTag: TBeverageTag | null;
	recipeTag: TRecipeTag | null;
}

const instance_beverage = Beverage.getInstance();
const instance_clothes = Clothes.getInstance();
const instance_cooker = Cooker.getInstance();
const instance_customer = CustomerRare.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_ornament = Ornament.getInstance();
const instance_partner = Partner.getInstance();
const instance_recipe = Recipe.getInstance();

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
	tachie: 12, // eslint-disable-next-line sort-keys
	moveTachie: 13,
	showCooker: 14,
	tableRows: 15, // eslint-disable-next-line sort-keys
	ingredientTag: 16,
	tablePersist: 17, // eslint-disable-next-line sort-keys
	mealData: 18,
} as const;

const state = {
	instances: {
		beverage: instance_beverage,
		clothes: instance_clothes,
		cooker: instance_cooker,
		customer: instance_customer,
		ingredient: instance_ingredient,
		ornament: instance_ornament,
		partner: instance_partner,
		recipe: instance_recipe,
	},

	beverage: {
		dlcs: instance_beverage.getValuesByProp('dlc', true).sort(numberSort),
		names: instance_beverage.getValuesByProp('name', true).sort(pinyinSort),
		tags: instance_beverage.sortedTags.map(toGetValueCollection),
	},
	customer: {
		dlcs: instance_customer.getValuesByProp('dlc', true).sort(numberSort),
		places: instance_customer.getValuesByProp('places', true).sort(pinyinSort),
	},
	ingredient: {
		dlcs: instance_ingredient.getValuesByProp('dlc', true).sort(numberSort),
		levels: instance_ingredient
			.getValuesByProp('level', true)
			.filter(({value}) => !instance_ingredient.blockedLevels.has(value))
			.sort(numberSort),
		tags: toArray<TIngredientTag[]>(
			instance_ingredient.getValuesByProp('tags').filter((tag) => !instance_ingredient.blockedTags.has(tag)),
			DYNAMIC_TAG_MAP.popularNegative,
			DYNAMIC_TAG_MAP.popularPositive
		)
			.map(toGetValueCollection)
			.sort(pinyinSort),
	},
	recipe: {
		cookers: instance_recipe.getValuesByProp('cooker', true).sort(pinyinSort),
		dlcs: instance_recipe.getValuesByProp('dlc', true).sort(numberSort),
		names: instance_recipe
			.getValuesByProp('name', true)
			.filter(({value}) => !instance_recipe.blockedRecipes.has(value))
			.sort(pinyinSort),
		tags: toArray<TRecipeTag[]>(
			instance_recipe.getValuesByProp('positiveTags').filter((tag) => !instance_recipe.blockedTags.has(tag)),
			DYNAMIC_TAG_MAP.popularNegative,
			DYNAMIC_TAG_MAP.popularPositive
		)
			.map(toGetValueCollection)
			.sort(pinyinSort),
	},

	persistence: {
		beverage: {
			table: {
				dlcs: [] as string[],
				rows: 8,
				sortDescriptor: {} as TBeverageTableSortDescriptor,
				visibleColumns: beverageTableColumns.map(toGetItemWithKey('key')),
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
			pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
			searchValue: '',
			tabVisibility: tabVisibilityStateMap.collapse as TTabVisibilityState,

			orderLinkedFilter: true,
			showTagDescription: true,
		},
		ingredient: {
			filters: {
				dlcs: [] as string[],
				tags: [] as string[], // eslint-disable-next-line sort-keys
				noTags: [] as string[], // eslint-disable-next-line sort-keys
				levels: [] as string[],
			},
			pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
			tabVisibility: tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		recipe: {
			table: {
				cookers: [] as string[],
				dlcs: [] as string[],
				rows: 8,
				sortDescriptor: {} as TRecipeTableSortDescriptor,
				visibleColumns: recipeTableColumns.filter(({key}) => key !== 'time').map(toGetItemWithKey('key')),
			},
		},

		meals: {} as {
			[key in TCustomerRareName]?: {
				index: number;
				order: ICustomerOrder;
				hasMystiaCooker: boolean;
				beverage: TBeverageName;
				recipe: IMealRecipe;
			}[];
		},
	},
	shared: {
		beverage: {
			name: null as TBeverageName | null,

			page: 1,
			searchValue: '',
			selectableRows: generateRange(5, 20).map(toGetValueCollection),
		},
		customer: {
			name: null as TCustomerRareName | null,

			order: {
				beverageTag: null,
				recipeTag: null,
			} as ICustomerOrder,
			select: {
				beverageTag: toSet() as SelectionSet,
				recipeTag: toSet() as SelectionSet,
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: {
				isNegative: false,
				tag: null,
			} as IPopularTrend,

			hasMystiaCooker: false,
			isDarkMatter: null as boolean | null,
			rating: null as TRatingKey | null,
		},
		ingredient: {
			filterVisibility: false,
		},
		recipe: {
			data: null as IMealRecipe | null,

			tagsWithTrend: [] as TRecipeTag[],

			page: 1,
			searchValue: '',
			selectableRows: generateRange(5, 20).map(toGetValueCollection),
		},
		tab: 'customer' as TTab,
	},
};

export type TCustomerRarePersistenceState = IPersistenceState<(typeof state)['persistence']>;

export const customerRareStoreKey = 'page-customer_rare-storage';

const getNames = createNamesCache(instance_customer);

type TSavedMealRatingResult = {
	isDarkMatter: boolean;
	price: number;
	rating: TRatingKey;
};
const savedMealRatingCache = new Map<string, TSavedMealRatingResult>();

export const customerRareStore = store(state, {
	persist: {
		enabled: true,
		name: customerRareStoreKey,
		version: storeVersion.mealData,

		migrate(persistedState, version) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
			const oldState = persistedState as any;
			if (version < storeVersion.rating) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(oldState.page.selected) as any) {
					for (const meal of meals) {
						meal.rating = 'exgood';
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
			if (version < storeVersion.moveTachie) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {customer},
				} = oldState;
				delete customer.showTachie;
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
			if (version < storeVersion.tablePersist) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {
					persistence: {
						beverage: {table: beverageTable},
						recipe: {table: recipeTable},
					},
				} = oldState;
				beverageTable.dlcs = [];
				beverageTable.sortDescriptor = {};
				recipeTable.cookers = [];
				recipeTable.dlcs = [];
				recipeTable.sortDescriptor = {};
			}
			if (version < storeVersion.mealData) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const {persistence} = oldState;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				for (const meals of Object.values(persistence.meals) as any) {
					for (const meal of meals) {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						const {extraIngredients, recipe: recipeName} = meal;
						meal.recipe = {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							extraIngredients, // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							name: recipeName,
						};
						delete meal.extraIngredients;
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
		customerNames: () => getNames(currentStore.persistence.customer.pinyinSortState.use()),

		beverageTableColumns: {
			read: () => toSet(currentStore.persistence.beverage.table.visibleColumns.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.beverage.table.visibleColumns.set(toArray<SelectionSet>(columns) as never);
			},
		},
		beverageTableDlcs: {
			read: () => toSet(currentStore.persistence.beverage.table.dlcs.use()) as SelectionSet,
			write: (dlcs: Selection) => {
				currentStore.persistence.beverage.table.dlcs.set(toArray<SelectionSet>(dlcs) as never);
			},
		},
		beverageTableRows: {
			read: () => toSet([currentStore.persistence.beverage.table.rows.use().toString()]) as SelectionSet,
			write: (rows: Selection) => {
				currentStore.persistence.beverage.table.rows.set(
					Number.parseInt(toArray<SelectionSet>(rows)[0] as string)
				);
			},
		},
		recipeTableColumns: {
			read: () => toSet(currentStore.persistence.recipe.table.visibleColumns.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.recipe.table.visibleColumns.set(toArray<SelectionSet>(columns) as never);
			},
		},
		recipeTableCookers: {
			read: () => toSet(currentStore.persistence.recipe.table.cookers.use()) as SelectionSet,
			write: (cookers: Selection) => {
				currentStore.persistence.recipe.table.cookers.set(toArray<SelectionSet>(cookers) as never);
			},
		},
		recipeTableDlcs: {
			read: () => toSet(currentStore.persistence.recipe.table.dlcs.use()) as SelectionSet,
			write: (dlcs: Selection) => {
				currentStore.persistence.recipe.table.dlcs.set(toArray<SelectionSet>(dlcs) as never);
			},
		},
		recipeTableRows: {
			read: () => toSet([currentStore.persistence.recipe.table.rows.use().toString()]) as SelectionSet,
			write: (rows: Selection) => {
				currentStore.persistence.recipe.table.rows.set(
					Number.parseInt(toArray<SelectionSet>(rows)[0] as string)
				);
			},
		},
	}))
	.actions((currentStore) => ({
		onCustomerFilterBeverageTag(tag: TBeverageTag, hasMystiaCooker: boolean) {
			currentStore.shared.tab.set('beverage');
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.select.beverageTag.set((prev) => {
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
			currentStore.shared.customer.select.recipeTag.set((prev) => {
				keepLastTag(prev, tag, {
					hasMystiaCooker,
					orderTag: currentStore.shared.customer.order.recipeTag.get(),
				});
			});
		},
		onCustomerOrderBeverageTag(tag: TBeverageTag) {
			currentStore.shared.customer.order.beverageTag.set((prev) => {
				if (prev === tag) {
					trackEvent(trackEvent.category.unselect, 'Customer Tag', tag);
					return null;
				}
				trackEvent(trackEvent.category.select, 'Customer Tag', tag);
				return tag;
			});
		},
		onCustomerOrderRecipeTag(tag: TRecipeTag) {
			currentStore.shared.customer.order.recipeTag.set((prev) => {
				if (prev === tag) {
					trackEvent(trackEvent.category.unselect, 'Customer Tag', tag);
					return null;
				}
				trackEvent(trackEvent.category.select, 'Customer Tag', tag);
				return tag;
			});
		},
		onCustomerSelectedChange(customerName: TCustomerRareName) {
			currentStore.shared.customer.name.set(customerName);
			trackEvent(trackEvent.category.select, 'Customer', customerName);
		},

		onBeverageTableAction(beverageName: TBeverageName) {
			currentStore.shared.beverage.name.set(beverageName);
			trackEvent(trackEvent.category.select, 'Beverage', beverageName);
		},
		onBeverageTablePageChange(page: number) {
			currentStore.shared.beverage.page.set(page);
		},
		onBeverageTableRowsPerPageChange(rows: Selection) {
			currentStore.beverageTableRows.set(rows);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSearchValueChange(value: string) {
			currentStore.shared.beverage.searchValue.set(value);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.beverageTableDlcs.set(dlcs);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSelectedTagsChange(tags: Selection) {
			currentStore.shared.customer.select.beverageTag.set(tags as SelectionSet);
			currentStore.shared.beverage.page.set(1);
		},
		onBeverageTableSortChange(config: TBeverageTableSortDescriptor) {
			currentStore.shared.beverage.page.set(1);
			const sortConfig = config as Required<TBeverageTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn, time} = currentStore.persistence.beverage.table.sortDescriptor.get();
			if (lastColumn === undefined || column !== lastColumn) {
				currentStore.persistence.beverage.table.sortDescriptor.assign({
					column,
					lastColumn: column,
				});
			}
			// Switch between ascending, descending and no sort.
			currentStore.persistence.beverage.table.sortDescriptor.assign({
				time: time === undefined ? 1 : time + 1,
			});
			if (time !== undefined) {
				if (column === lastColumn) {
					if (time % 2 === 0) {
						currentStore.persistence.beverage.table.sortDescriptor.set({});
						return;
					}
				} else {
					currentStore.persistence.beverage.table.sortDescriptor.assign({
						time: 1,
					});
				}
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if ((column === 'price' || column === 'suitability') && column !== lastColumn) {
				reversedDirection = reverseDirection(direction);
			}
			currentStore.persistence.beverage.table.sortDescriptor.assign({
				direction: reversedDirection,
			});
		},

		onIngredientSelectedChange(ingredientName: TIngredientName) {
			const recipeData = currentStore.shared.recipe.data.get();
			let recipe: TRecipe | null = null;
			if (recipeData !== null) {
				recipe = instance_recipe.getPropsByName(recipeData.name);
			}
			if (recipe === null) {
				return;
			}
			currentStore.shared.recipe.data.set((prev) => {
				if (prev !== null && recipe.ingredients.length + prev.extraIngredients.length < 5) {
					prev.extraIngredients.push(ingredientName);
				}
			});
			trackEvent(trackEvent.category.select, 'Ingredient', ingredientName);
		},

		onRecipeTableAction(recipeName: TRecipeName) {
			currentStore.shared.recipe.data.set({
				extraIngredients: [],
				name: recipeName,
			});
			trackEvent(trackEvent.category.select, 'Recipe', recipeName);
		},
		onRecipeTablePageChange(page: number) {
			currentStore.shared.recipe.page.set(page);
		},
		onRecipeTableRowsPerPageChange(rows: Selection) {
			currentStore.recipeTableRows.set(rows);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSearchValueChange(value: string) {
			currentStore.shared.recipe.searchValue.set(value);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSelectedCookersChange(cookers: Selection) {
			currentStore.recipeTableCookers.set(cookers);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.recipeTableDlcs.set(dlcs);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSelectedPositiveTagsChange(tags: Selection) {
			currentStore.shared.customer.select.recipeTag.set(tags as SelectionSet);
			currentStore.shared.recipe.page.set(1);
		},
		onRecipeTableSortChange(config: TRecipeTableSortDescriptor) {
			currentStore.shared.recipe.page.set(1);
			const sortConfig = config as Required<TRecipeTableSortDescriptor>;
			const {column, direction} = sortConfig;
			const {lastColumn, time} = currentStore.persistence.recipe.table.sortDescriptor.get();
			if (lastColumn === undefined || column !== lastColumn) {
				currentStore.persistence.recipe.table.sortDescriptor.assign({
					column,
					lastColumn: column,
				});
			}
			// Switch between ascending, descending and no sort.
			currentStore.persistence.recipe.table.sortDescriptor.assign({
				time: time === undefined ? 1 : time + 1,
			});
			if (time !== undefined) {
				if (column === lastColumn) {
					if (time % 2 === 0) {
						currentStore.persistence.recipe.table.sortDescriptor.set({});
						return;
					}
				} else {
					currentStore.persistence.recipe.table.sortDescriptor.assign({
						time: 1,
					});
				}
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if ((column === 'price' || column === 'suitability') && column !== lastColumn) {
				reversedDirection = reverseDirection(direction);
			}
			currentStore.persistence.recipe.table.sortDescriptor.assign({
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
			const {
				beverageTags: customerBeverageTags,
				negativeTags: customerNegativeTags,
				positiveTags: customerPositiveTags,
			} = instance_customer.getPropsByName(customerName);
			const customerOrder = currentStore.shared.customer.order.get();
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			const isDarkMatter = Boolean(currentStore.shared.customer.isDarkMatter.get());
			const beverageTags: TBeverageTag[] = [];
			const beverageName = currentStore.shared.beverage.name.get();
			if (beverageName !== null) {
				beverageTags.push(...instance_beverage.getPropsByName(beverageName, 'tags'));
			}
			const recipeData = currentStore.shared.recipe.data.get();
			const recipeName = recipeData?.name ?? null;
			const ingredients: TIngredientName[] = [];
			if (recipeData !== null) {
				ingredients.push(
					...instance_recipe.getPropsByName(recipeData.name, 'ingredients'),
					...recipeData.extraIngredients
				);
			}
			const recipeTagsWithTrend = currentStore.shared.recipe.tagsWithTrend.get();
			const rating = instance_customer.evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags: customerNegativeTags,
				currentCustomerOrder: customerOrder,
				currentCustomerPositiveTags: customerPositiveTags,
				currentIngredients: ingredients,
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: recipeTagsWithTrend,
				hasMystiaCooker,
				isDarkMatter,
			});
			currentStore.shared.customer.rating.set(rating);
		},
		evaluateSavedMealResult(data: {
			customerName: TCustomerRareName;
			customerOrder: ICustomerOrder;
			hasMystiaCooker: boolean;
			beverageName: TBeverageName;
			recipeData: IMealRecipe;
			isFamousShop: boolean;
			popularTrend: IPopularTrend;
		}) {
			const stringifiedData = JSON.stringify(data);
			if (savedMealRatingCache.has(stringifiedData)) {
				return savedMealRatingCache.get(stringifiedData);
			}
			const {
				beverageName,
				customerName,
				customerOrder,
				hasMystiaCooker,
				isFamousShop,
				popularTrend,
				recipeData: {extraIngredients, name: recipeName},
			} = data;
			const {
				beverageTags: customerBeverageTags,
				negativeTags: customerNegativeTags,
				positiveTags: customerPositiveTags,
			} = instance_customer.getPropsByName(customerName);
			const beverage = instance_beverage.getPropsByName(beverageName);
			const {price: beveragePrice, tags: beverageTags} = beverage;
			const recipe = instance_recipe.getPropsByName(recipeName);
			const {ingredients, negativeTags, positiveTags, price: originalRecipePrice} = recipe;
			const {extraTags, isDarkMatter} = instance_recipe.checkDarkMatter({
				extraIngredients,
				negativeTags,
			});
			const recipePrice = isDarkMatter ? DARK_MATTER_META_MAP.price : originalRecipePrice;
			const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
				ingredients,
				extraIngredients,
				positiveTags,
				extraTags,
				popularTrend
			);
			const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
				composedRecipeTags,
				popularTrend,
				isFamousShop
			);
			const rating = instance_customer.evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags: customerNegativeTags,
				currentCustomerOrder: customerOrder,
				currentCustomerPositiveTags: customerPositiveTags,
				currentIngredients: union(ingredients, extraIngredients),
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: recipeTagsWithTrend,
				hasMystiaCooker,
				isDarkMatter,
			});
			const result = {
				isDarkMatter,
				price: beveragePrice + recipePrice,
				rating,
			} as TSavedMealRatingResult;
			savedMealRatingCache.set(stringifiedData, result);
			return result;
		},
		removeMealIngredient(ingredientName: TIngredientName) {
			currentStore.shared.recipe.data.set((prev) => {
				if (prev !== null) {
					prev.extraIngredients = removeLastElement(prev.extraIngredients, ingredientName);
				}
			});
			trackEvent(trackEvent.category.unselect, 'Ingredient', ingredientName);
		},
		saveMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			const beverageName = currentStore.shared.beverage.name.get();
			const recipeData = currentStore.shared.recipe.data.get();
			if (customerName === null || beverageName === null || recipeData === null) {
				return;
			}
			const {extraIngredients, name: recipeName} = recipeData;
			const customerOrder = currentStore.shared.customer.order.get();
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			const isDarkMatter = currentStore.shared.customer.isDarkMatter.get();
			const saveObject = {
				beverage: beverageName,
				hasMystiaCooker,
				order:
					hasMystiaCooker && !isDarkMatter
						? {
								beverageTag: null,
								recipeTag: null,
							}
						: customerOrder,
				recipe: {
					extraIngredients,
					name: recipeName,
				},
			} as const;
			currentStore.persistence.meals.set((prev) => {
				if (customerName in prev) {
					const indexes = prev[customerName]?.map(({index}) => index) ?? [];
					const index = checkEmpty(indexes) ? 0 : Math.max(...indexes, 0) + 1;
					prev[customerName]?.push({...saveObject, index});
				} else {
					prev[customerName] = [{...saveObject, index: 0}];
				}
			});
			trackEvent(
				trackEvent.category.click,
				'Save Button',
				`${recipeName} - ${beverageName}${checkEmpty(extraIngredients) ? '' : ` - ${extraIngredients.join(' ')}`}`
			);
		},

		refreshCustomer(name: TCustomerRareName | null) {
			currentStore.shared.customer.name.set(name);
			currentStore.shared.tab.set('customer');
			currentStore.shared.customer.filterVisibility.set(true);
			currentStore.shared.recipe.searchValue.set('');
			currentStore.shared.beverage.searchValue.set('');
			currentStore.shared.ingredient.filterVisibility.set(false);
		},
		refreshCustomerSelectedItems() {
			currentStore.shared.customer.order.set({
				beverageTag: null,
				recipeTag: null,
			});
			currentStore.shared.customer.select.set({
				beverageTag: toSet(),
				recipeTag: toSet(),
			});
			currentStore.shared.customer.hasMystiaCooker.set(false);
			currentStore.shared.customer.isDarkMatter.set(null);
			currentStore.shared.customer.rating.set(null);
			currentStore.shared.recipe.data.set(null);
			currentStore.shared.recipe.page.set(1);
			currentStore.shared.beverage.name.set(null);
			currentStore.shared.beverage.page.set(1);
			currentStore.shared.ingredient.filterVisibility.set(false);
			if (currentStore.shared.tab.get() === 'ingredient') {
				if (currentStore.shared.customer.name.get() === null) {
					currentStore.shared.tab.set('customer');
				} else {
					currentStore.shared.tab.set('recipe');
				}
			}
		},
		toggleCustomerTabVisibilityState() {
			currentStore.persistence.customer.tabVisibility.set(reverseVisibilityState);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.persistence.ingredient.tabVisibility.set(reverseVisibilityState);
		},
		toggleMystiaCooker() {
			const hasMystiaCooker = currentStore.shared.customer.hasMystiaCooker.get();
			currentStore.shared.customer.hasMystiaCooker.set(!hasMystiaCooker);
			trackEvent(hasMystiaCooker ? trackEvent.category.unselect : trackEvent.category.select, 'MystiaCooker');
		},
		updateRecipeTagsWithTrend() {
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData === null) {
				currentStore.shared.recipe.tagsWithTrend.set([]);
			} else {
				const {extraIngredients, name} = recipeData;
				const {ingredients, positiveTags} = instance_recipe.getPropsByName(name);
				const extraTags = extraIngredients.flatMap((extraIngredient) =>
					instance_ingredient.getPropsByName(extraIngredient, 'tags')
				);
				const popularTrend = currentStore.shared.customer.popularTrend.get();
				const isFamousShop = currentStore.shared.customer.famousShop.get();
				const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
					ingredients,
					extraIngredients,
					positiveTags,
					extraTags,
					popularTrend
				);
				const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
					composedRecipeTags,
					popularTrend,
					isFamousShop
				);
				currentStore.shared.recipe.tagsWithTrend.set(recipeTagsWithTrend);
			}
		},
	}));

customerRareStore.shared.customer.name.onChange((name) => {
	customerRareStore.refreshCustomer(name);
	customerRareStore.refreshCustomerSelectedItems();
});

customerRareStore.shared.customer.order.onChange(customerRareStore.evaluateMealResult);

customerRareStore.shared.customer.famousShop.onChange(() => {
	customerRareStore.updateRecipeTagsWithTrend();
	customerRareStore.evaluateMealResult();
});
customerRareStore.shared.customer.popularTrend.onChange(() => {
	customerRareStore.updateRecipeTagsWithTrend();
	customerRareStore.evaluateMealResult();
});

customerRareStore.shared.customer.hasMystiaCooker.onChange(customerRareStore.evaluateMealResult);
customerRareStore.shared.customer.isDarkMatter.onChange(customerRareStore.evaluateMealResult);

customerRareStore.shared.beverage.name.onChange(customerRareStore.evaluateMealResult);
customerRareStore.shared.recipe.data.onChange((data) => {
	customerRareStore.updateRecipeTagsWithTrend();
	customerRareStore.evaluateMealResult();
	if (data !== null) {
		if (checkEmpty(data.extraIngredients)) {
			customerRareStore.shared.customer.isDarkMatter.set(false);
		} else {
			customerRareStore.shared.customer.isDarkMatter.set(instance_recipe.checkDarkMatter(data).isDarkMatter);
		}
	}
});
