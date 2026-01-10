import { type Key } from 'react';
import { store } from '@davstack/store';

import { type Selection } from '@heroui/table';

import { tabVisibilityStateMap } from '@/(pages)/customer-normal/constants';
import { type TTableSortDescriptor as TBeverageTableSortDescriptor } from '@/(pages)/customer-normal/beverageTabContent';
import { type TTableSortDescriptor as TRecipeTableSortDescriptor } from '@/(pages)/customer-normal/recipeTabContent';
import type {
	TTab,
	TTabVisibilityState,
} from '@/(pages)/customer-normal/types';
import { trackEvent } from '@/components/analytics';
import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import {
	DYNAMIC_TAG_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCustomerNormalName,
	type TDlc,
	type TIngredientName,
	type TIngredientTag,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import {
	persist as persistMiddleware,
	sync as syncMiddleware,
} from '@/stores/middlewares';
import {
	createNamesCache,
	keepLastTag,
	reverseDirection,
	reverseVisibilityState,
} from '@/stores/utils';
import type { IMealRecipe, IPopularTrend, TPopularTag } from '@/types';
import {
	checkEmpty,
	numberSort,
	pinyinSort,
	removeLastElement,
	sortBy,
	toArray,
	toGetValueCollection,
	toSet,
} from '@/utilities';
import { Beverage, Clothes, CustomerNormal, Ingredient, Recipe } from '@/utils';
import type { TRecipe } from '@/utils/types';

const instance_beverage = Beverage.getInstance();
const instance_clothes = Clothes.getInstance();
const instance_customer = CustomerNormal.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const storeName = 'page-customer_normal-storage';
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
	tablePersist: 12, // eslint-disable-next-line sort-keys
	mealData: 13,
	tableShare: 14, // eslint-disable-next-line sort-keys
	deleteMealIndex: 15,
} as const;

const state = {
	instances: {
		beverage: instance_beverage,
		clothes: instance_clothes,
		customer: instance_customer,
		ingredient: instance_ingredient,
		recipe: instance_recipe,
	},

	persistence: {
		beverage: {
			table: {
				dlcs: [] as string[],
				sortDescriptor: {} as TBeverageTableSortDescriptor,
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
			tabVisibility:
				tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		ingredient: {
			filters: {
				dlcs: [] as string[],
				tags: [] as string[], // eslint-disable-next-line sort-keys
				noTags: [] as string[], // eslint-disable-next-line sort-keys
				levels: [] as string[],
			},
			pinyinSortState: pinyinSortStateMap.none as TPinyinSortState,
			tabVisibility:
				tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		recipe: {
			table: {
				cookers: [] as string[],
				dlcs: [] as string[],
				sortDescriptor: {} as TRecipeTableSortDescriptor,
			},
		},

		meals: {} as Partial<
			Record<
				TCustomerNormalName,
				Array<{ beverage: TBeverageName | null; recipe: IMealRecipe }>
			>
		>,
	},
	shared: {
		beverage: {
			name: null as TBeverageName | null,

			searchValue: '',
			table: {
				columns: toSet() as SelectionSet,
				hiddenBeverages: toSet<TBeverageName>(),
				page: 1,
				row: 1,
				rows: toSet() as SelectionSet,
				selectableRows: [] as Array<Record<'value', number>>,
			},
		},
		customer: {
			name: null as TCustomerNormalName | null,

			select: {
				beverageTag: toSet() as SelectionSet,
				recipeTag: toSet() as SelectionSet,
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: { isNegative: false, tag: null } as IPopularTrend,

			rating: null as TRatingKey | null,
		},
		hiddenItems: { dlcs: toSet<TDlc>() },
		ingredient: { filterVisibility: false },
		recipe: {
			data: null as IMealRecipe | null,

			tagsWithTrend: [] as TRecipeTag[],

			searchValue: '',
			table: {
				columns: toSet() as SelectionSet,
				hiddenIngredients: toSet<TIngredientName>(),
				hiddenRecipes: toSet<TRecipeName>(),
				page: 1,
				row: 1,
				rows: toSet() as SelectionSet,
				selectableRows: [] as Array<Record<'value', number>>,
			},
		},
		tab: 'customer' as TTab,
	},
};

const getNames = createNamesCache(instance_customer);

const savedMealRatingCache = new Map<string, TRatingKey>();

export const customerNormalStore = store(state, {
	middlewares: [
		syncMiddleware<typeof state>({
			name: storeName,
			watch: ['persistence.meals'],
		}),
		persistMiddleware<typeof state>({
			name: storeName,
			version: storeVersion.deleteMealIndex,

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
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						oldState.persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							meal.popular = { isNegative: false, tag: null };
						}
					}
				}
				if (version < storeVersion.ingredientLevel) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: {
							ingredient: { filters },
						},
					} = oldState;
					filters.levels = [];
				}
				if (version < storeVersion.rating) {
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						oldState.persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							meal.rating = 'norm';
						}
					}
				}
				if (version < storeVersion.extraCustomer) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: {
							customer: { filters },
						},
					} = oldState;
					filters.includes = [];
					filters.excludes = [];
				}
				if (version < storeVersion.dynamicMeal) {
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						oldState.persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
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
								table: { visibleColumns },
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
							beverage: { table: beverageTable },
							recipe: { table: recipeTable },
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
							ingredient: { filters },
						},
					} = oldState;
					filters.tags = [];
					filters.noTags = [];
				}
				if (version < storeVersion.removeBeverage) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					delete persistence.beverage;
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							delete meal.beverage;
						}
					}
				}
				if (version < storeVersion.addBackBeverage) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					persistence.beverage = {
						table: {
							rows: 8,
							visibleColumns: [
								'action',
								'beverage',
								'price',
								'suitability',
							],
						},
					};
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							meal.beverage = null;
						}
					}
				}
				if (version < storeVersion.tablePersist) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: {
							beverage: { table: beverageTable },
							recipe: { table: recipeTable },
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
					const { persistence } = oldState;
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							const { extraIngredients, recipe: recipeName } =
								meal;
							meal.recipe = {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								extraIngredients, // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								name: recipeName,
							};
							delete meal.extraIngredients;
						}
					}
				}
				if (version < storeVersion.tableShare) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {
						persistence: {
							beverage: { table: beverageTable },
							recipe: { table: recipeTable },
						},
					} = oldState;
					delete beverageTable.rows;
					delete beverageTable.visibleColumns;
					delete recipeTable.rows;
					delete recipeTable.visibleColumns;
				}
				if (version < storeVersion.deleteMealIndex) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					for (const meals of Object.values(
						// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						persistence.meals
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					) as any) {
						for (const meal of meals) {
							delete meal.index;
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
		}),
	],
})
	.computed((currentStore) => ({
		availableBeverageDlcs: () =>
			currentStore.instances.beverage
				.get()
				.getValuesByProp('dlc', true)
				.filter(
					({ value }) =>
						!currentStore.shared.hiddenItems.dlcs.use().has(value)
				)
				.sort(numberSort),
		availableBeverageNames: () =>
			currentStore.instances.beverage
				.get()
				.getValuesByProp(
					'name',
					true,
					currentStore.instances.beverage
						.get()
						.data.filter(
							({ dlc }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc)
						)
				)
				.sort(pinyinSort),
		availableBeverageTags: () =>
			sortBy(
				currentStore.instances.beverage.get().sortedTags,
				currentStore.instances.beverage.get().getValuesByProp(
					'tags',
					false,
					currentStore.instances.beverage
						.get()
						.data.filter(
							({ dlc }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc)
						)
				)
			).map(toGetValueCollection),
		availableCustomerDlcs: () =>
			currentStore.instances.customer
				.get()
				.getValuesByProp('dlc', true)
				.filter(
					({ value }) =>
						!currentStore.shared.hiddenItems.dlcs.use().has(value)
				)
				.sort(numberSort),
		availableCustomerNames: () =>
			sortBy(
				getNames(
					currentStore.persistence.customer.pinyinSortState.use()
				),
				currentStore.instances.customer.get().getValuesByProp(
					'name',
					false,
					currentStore.instances.customer
						.get()
						.data.filter(
							({ dlc }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc)
						)
				)
			).map(toGetValueCollection),
		availableCustomerPlaces: () =>
			currentStore.instances.customer
				.get()
				.getValuesByProp(
					'places',
					true,
					currentStore.instances.customer
						.get()
						.data.filter(
							({ dlc }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc)
						)
				)
				.sort(pinyinSort),
		availableIngredientDlcs: () =>
			currentStore.instances.ingredient
				.get()
				.getValuesByProp('dlc', true)
				.filter(
					({ value }) =>
						!currentStore.shared.hiddenItems.dlcs.use().has(value)
				)
				.sort(numberSort),
		availableIngredientLevels: () =>
			currentStore.instances.ingredient
				.get()
				.getValuesByProp(
					'level',
					true,
					currentStore.instances.ingredient
						.get()
						.data.filter(
							({ dlc, level }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc) &&
								!currentStore.instances.ingredient
									.get()
									.blockedLevels.has(level)
						)
				)
				.sort(numberSort),
		availableIngredientTags: () =>
			toArray<TIngredientTag[]>(
				currentStore.instances.ingredient.get().getValuesByProp(
					'tags',
					false,
					currentStore.instances.ingredient
						.get()
						.data.filter(
							({ dlc, tags }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc) &&
								!tags.some((tag) =>
									currentStore.instances.ingredient
										.get()
										.blockedTags.has(tag)
								)
						)
				),
				DYNAMIC_TAG_MAP.popularNegative,
				DYNAMIC_TAG_MAP.popularPositive
			)
				.map(toGetValueCollection)
				.sort(pinyinSort),
		availableRecipeCookers: () =>
			currentStore.instances.recipe
				.get()
				.getValuesByProp(
					'cooker',
					true,
					currentStore.instances.recipe
						.get()
						.data.filter(
							({ dlc }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc)
						)
				)
				.sort(pinyinSort),
		availableRecipeDlcs: () =>
			currentStore.instances.recipe
				.get()
				.getValuesByProp('dlc', true)
				.filter(
					({ value }) =>
						!currentStore.shared.hiddenItems.dlcs.use().has(value)
				)
				.sort(numberSort),
		availableRecipeNames: () =>
			currentStore.instances.recipe
				.get()
				.getValuesByProp(
					'name',
					true,
					currentStore.instances.recipe
						.get()
						.data.filter(
							({ dlc, name }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc) &&
								!currentStore.instances.recipe
									.get()
									.blockedRecipes.has(name)
						)
				)
				.sort(pinyinSort),
		availableRecipeTags: () =>
			toArray<TRecipeTag[]>(
				currentStore.instances.recipe.get().getValuesByProp(
					'positiveTags',
					false,
					currentStore.instances.recipe
						.get()
						.data.filter(
							({ dlc, positiveTags }) =>
								!currentStore.shared.hiddenItems.dlcs
									.use()
									.has(dlc) &&
								!positiveTags.some((positiveTag) =>
									currentStore.instances.recipe
										.get()
										.blockedTags.has(positiveTag)
								)
						)
				),
				DYNAMIC_TAG_MAP.popularNegative,
				DYNAMIC_TAG_MAP.popularPositive
			)
				.map(toGetValueCollection)
				.sort(pinyinSort),

		beverageTableDlcs: {
			read: () =>
				toSet(
					currentStore.persistence.beverage.table.dlcs.use()
				) as SelectionSet,
			write: (dlcs: Selection) => {
				currentStore.persistence.beverage.table.dlcs.set(
					toArray<SelectionSet>(dlcs) as never
				);
			},
		},
		recipeTableCookers: {
			read: () =>
				toSet(
					currentStore.persistence.recipe.table.cookers.use()
				) as SelectionSet,
			write: (cookers: Selection) => {
				currentStore.persistence.recipe.table.cookers.set(
					toArray<SelectionSet>(cookers) as never
				);
			},
		},
		recipeTableDlcs: {
			read: () =>
				toSet(
					currentStore.persistence.recipe.table.dlcs.use()
				) as SelectionSet,
			write: (dlcs: Selection) => {
				currentStore.persistence.recipe.table.dlcs.set(
					toArray<SelectionSet>(dlcs) as never
				);
			},
		},
	}))
	.actions((currentStore) => ({
		onCustomerFilterBeverageTag(tag: TBeverageTag) {
			currentStore.shared.tab.set('beverage');
			currentStore.shared.beverage.table.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.select.beverageTag.set((prev) => {
				keepLastTag(prev, tag);
			});
		},
		onCustomerFilterRecipeTag(tag: TRecipeTag) {
			currentStore.shared.tab.set('recipe');
			currentStore.shared.recipe.table.page.set(1);
			currentStore.shared.customer.filterVisibility.set(false);
			currentStore.shared.ingredient.filterVisibility.set(false);
			currentStore.shared.customer.select.recipeTag.set((prev) => {
				keepLastTag(prev, tag);
			});
		},
		onCustomerSelectedChange(customerName: TCustomerNormalName | null) {
			currentStore.shared.customer.name.set((prev) => {
				if (prev === null) {
					trackEvent(
						trackEvent.category.select,
						'Customer',
						customerName as TCustomerNormalName
					);
				} else if (customerName === null) {
					trackEvent(trackEvent.category.unselect, 'Customer', prev);
				} else {
					trackEvent(trackEvent.category.unselect, 'Customer', prev);
					trackEvent(
						trackEvent.category.select,
						'Customer',
						customerName
					);
				}
				return customerName;
			});
		},

		onBeverageTableAction(beverageName: TBeverageName) {
			currentStore.shared.beverage.name.set(beverageName);
			trackEvent(trackEvent.category.select, 'Beverage', beverageName);
		},
		onBeverageTablePageChange(page: number) {
			currentStore.shared.beverage.table.page.set(page);
		},
		onBeverageTableSearchValueChange(value: string) {
			currentStore.shared.beverage.searchValue.set(value);
			currentStore.shared.beverage.table.page.set(1);
		},
		onBeverageTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.beverageTableDlcs.set(dlcs);
			currentStore.shared.beverage.table.page.set(1);
		},
		onBeverageTableSelectedTagsChange(tags: Selection) {
			currentStore.shared.customer.select.beverageTag.set(
				tags as SelectionSet
			);
			currentStore.shared.beverage.table.page.set(1);
		},
		onBeverageTableSortChange(config: TBeverageTableSortDescriptor) {
			currentStore.shared.beverage.table.page.set(1);
			const sortConfig = config as Required<TBeverageTableSortDescriptor>;
			const { column, direction } = sortConfig;
			const { lastColumn, time } =
				currentStore.persistence.beverage.table.sortDescriptor.get();
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
						currentStore.persistence.beverage.table.sortDescriptor.set(
							{}
						);
						return;
					}
				} else {
					currentStore.persistence.beverage.table.sortDescriptor.assign(
						{ time: 1 }
					);
				}
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if (
				(column === 'price' || column === 'suitability') &&
				column !== lastColumn
			) {
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
				if (
					prev !== null &&
					recipe.ingredients.length + prev.extraIngredients.length < 5
				) {
					prev.extraIngredients.push(ingredientName);
				}
			});
			trackEvent(
				trackEvent.category.select,
				'Ingredient',
				ingredientName
			);
		},

		onRecipeTableAction(recipeName: TRecipeName) {
			currentStore.shared.recipe.data.set({
				extraIngredients: [],
				name: recipeName,
			});
			trackEvent(trackEvent.category.select, 'Recipe', recipeName);
		},
		onRecipeTablePageChange(page: number) {
			currentStore.shared.recipe.table.page.set(page);
		},
		onRecipeTableSearchValueChange(value: string) {
			currentStore.shared.recipe.searchValue.set(value);
			currentStore.shared.recipe.table.page.set(1);
		},
		onRecipeTableSelectedCookersChange(cookers: Selection) {
			currentStore.recipeTableCookers.set(cookers);
			currentStore.shared.recipe.table.page.set(1);
		},
		onRecipeTableSelectedDlcsChange(dlcs: Selection) {
			currentStore.recipeTableDlcs.set(dlcs);
			currentStore.shared.recipe.table.page.set(1);
		},
		onRecipeTableSelectedPositiveTagsChange(tags: Selection) {
			currentStore.shared.customer.select.recipeTag.set(
				tags as SelectionSet
			);
			currentStore.shared.recipe.table.page.set(1);
		},
		onRecipeTableSortChange(config: TRecipeTableSortDescriptor) {
			currentStore.shared.recipe.table.page.set(1);
			const sortConfig = config as Required<TRecipeTableSortDescriptor>;
			const { column, direction } = sortConfig;
			const { lastColumn, time } =
				currentStore.persistence.recipe.table.sortDescriptor.get();
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
						currentStore.persistence.recipe.table.sortDescriptor.set(
							{}
						);
						return;
					}
				} else {
					currentStore.persistence.recipe.table.sortDescriptor.assign(
						{ time: 1 }
					);
				}
			}
			// Reverse direction `ascending` to `descending` when first time
			let reversedDirection = direction;
			if (
				(column === 'price' || column === 'suitability') &&
				column !== lastColumn
			) {
				reversedDirection = reverseDirection(direction);
			}
			currentStore.persistence.recipe.table.sortDescriptor.assign({
				direction: reversedDirection,
			});
		},

		onTabSelectionChange(tab: Key) {
			currentStore.shared.tab.set(tab as TTab);
			currentStore.shared.customer.filterVisibility.set(
				tab === 'customer'
			);
			currentStore.shared.ingredient.filterVisibility.set(
				tab === 'ingredient'
			);
		},

		evaluateMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			if (customerName === null) {
				return;
			}
			const customerPositiveTags = instance_customer.getPropsByName(
				customerName,
				'positiveTags'
			);
			const customerPopularTrend =
				currentStore.shared.customer.popularTrend.get();
			const extraIngredients: TIngredientName[] = [];
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData !== null) {
				extraIngredients.push(...recipeData.extraIngredients);
			}
			const extraTags: TPopularTag[] = [];
			extraIngredients.forEach((ingredient) => {
				extraTags.push(
					...(instance_ingredient.getPropsByName(
						ingredient,
						'tags'
					) as TPopularTag[])
				);
			});
			let recipe: TRecipe | null = null;
			if (recipeData !== null) {
				recipe = instance_recipe.getPropsByName(recipeData.name);
			}
			const isFamousShop = currentStore.shared.customer.famousShop.get();
			const rating = instance_customer.evaluateMeal({
				currentCustomerName: customerName,
				currentCustomerPopularTrend: customerPopularTrend,
				currentCustomerPositiveTags: customerPositiveTags,
				currentExtraIngredientsLength: extraIngredients.length,
				currentExtraTags: extraTags,
				currentRecipe: recipe,
				isFamousShop,
			});
			currentStore.shared.customer.rating.set(rating);
		},
		evaluateSavedMealResult(data: {
			customerName: TCustomerNormalName;
			recipeData: IMealRecipe;
			isFamousShop: boolean;
			popularTrend: IPopularTrend;
		}) {
			const stringifiedData = JSON.stringify(data);
			if (savedMealRatingCache.has(stringifiedData)) {
				return savedMealRatingCache.get(stringifiedData);
			}
			const {
				customerName,
				isFamousShop,
				popularTrend,
				recipeData: { extraIngredients, name: recipeName },
			} = data;
			const extraTags: TPopularTag[] = [];
			extraIngredients.forEach((ingredient) => {
				extraTags.push(
					...(instance_ingredient.getPropsByName(
						ingredient,
						'tags'
					) as TPopularTag[])
				);
			});
			const rating = instance_customer.evaluateMeal({
				currentCustomerName: customerName,
				currentCustomerPopularTrend: popularTrend,
				currentCustomerPositiveTags: instance_customer.getPropsByName(
					customerName,
					'positiveTags'
				),
				currentExtraIngredientsLength: extraIngredients.length,
				currentExtraTags: extraTags,
				currentRecipe: instance_recipe.getPropsByName(recipeName),
				isFamousShop,
			}) as TRatingKey;
			savedMealRatingCache.set(stringifiedData, rating);
			return rating;
		},
		removeMealIngredient(ingredientName: TIngredientName) {
			currentStore.shared.recipe.data.set((prev) => {
				if (prev !== null) {
					prev.extraIngredients = removeLastElement(
						prev.extraIngredients,
						ingredientName
					);
				}
			});
			trackEvent(
				trackEvent.category.unselect,
				'Ingredient',
				ingredientName
			);
		},
		saveMealResult() {
			const customerName = currentStore.shared.customer.name.get();
			const beverageName = currentStore.shared.beverage.name.get();
			const recipeData = currentStore.shared.recipe.data.get();
			if (customerName === null || recipeData === null) {
				return;
			}
			const { extraIngredients, name: recipeName } = recipeData;
			const saveObject = {
				beverage: beverageName,
				recipe: { extraIngredients, name: recipeName },
			} as const;
			currentStore.persistence.meals.set((prev) => {
				if (customerName in prev) {
					prev[customerName]?.push(saveObject);
				} else {
					prev[customerName] = [saveObject];
				}
			});
			trackEvent(
				trackEvent.category.click,
				'Save Button',
				`${recipeName}${beverageName === null ? '' : ` - ${beverageName}`}${checkEmpty(extraIngredients) ? '' : ` - ${extraIngredients.join(' ')}`}`
			);
		},

		refreshCustomer(name: TCustomerNormalName | null) {
			currentStore.shared.customer.name.set(name);
			currentStore.shared.tab.set('customer');
			currentStore.shared.customer.filterVisibility.set(true);
			currentStore.shared.recipe.searchValue.set('');
			currentStore.shared.beverage.searchValue.set('');
			currentStore.shared.ingredient.filterVisibility.set(false);
		},
		refreshCustomerSelectedItems() {
			currentStore.shared.customer.select.set({
				beverageTag: toSet(),
				recipeTag: toSet(),
			});
			currentStore.shared.customer.rating.set(null);
			currentStore.shared.recipe.data.set(null);
			currentStore.shared.recipe.table.page.set(1);
			currentStore.shared.beverage.name.set(null);
			currentStore.shared.beverage.table.page.set(1);
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
			currentStore.persistence.customer.tabVisibility.set(
				reverseVisibilityState
			);
		},
		toggleIngredientTabVisibilityState() {
			currentStore.persistence.ingredient.tabVisibility.set(
				reverseVisibilityState
			);
		},
		updateRecipeTagsWithTrend() {
			const recipeData = currentStore.shared.recipe.data.get();
			if (recipeData === null) {
				currentStore.shared.recipe.tagsWithTrend.set([]);
			} else {
				const { extraIngredients, name } = recipeData;
				const { ingredients, positiveTags } =
					instance_recipe.getPropsByName(name);
				const extraTags = extraIngredients.flatMap((extraIngredient) =>
					instance_ingredient.getPropsByName(extraIngredient, 'tags')
				);
				const popularTrend =
					currentStore.shared.customer.popularTrend.get();
				const isFamousShop =
					currentStore.shared.customer.famousShop.get();
				const composedRecipeTags =
					instance_recipe.composeTagsWithPopularTrend(
						ingredients,
						extraIngredients,
						positiveTags,
						extraTags,
						popularTrend
					);
				const recipeTagsWithTrend =
					instance_recipe.calculateTagsWithTrend(
						composedRecipeTags,
						popularTrend,
						isFamousShop
					);
				currentStore.shared.recipe.tagsWithTrend.set(
					recipeTagsWithTrend
				);
			}
		},
	}));

customerNormalStore.shared.customer.name.onChange((name) => {
	customerNormalStore.refreshCustomer(name);
	customerNormalStore.refreshCustomerSelectedItems();
});

customerNormalStore.shared.customer.famousShop.onChange(() => {
	customerNormalStore.updateRecipeTagsWithTrend();
	customerNormalStore.evaluateMealResult();
	customerNormalStore.shared.beverage.table.page.set(1);
	customerNormalStore.shared.recipe.table.page.set(1);
});
customerNormalStore.shared.customer.popularTrend.onChange(() => {
	customerNormalStore.updateRecipeTagsWithTrend();
	customerNormalStore.evaluateMealResult();
	customerNormalStore.shared.beverage.table.page.set(1);
	customerNormalStore.shared.recipe.table.page.set(1);
});

customerNormalStore.shared.recipe.data.onChange(() => {
	customerNormalStore.updateRecipeTagsWithTrend();
	customerNormalStore.evaluateMealResult();
});

customerNormalStore.shared.hiddenItems.dlcs.onChange(() => {
	customerNormalStore.persistence.beverage.table.dlcs.set([]);
	customerNormalStore.persistence.customer.filters.set({
		dlcs: [],
		excludes: [],
		includes: [],
		noPlaces: [],
		places: [],
	});
	customerNormalStore.persistence.ingredient.filters.set({
		dlcs: [],
		levels: [],
		noTags: [],
		tags: [],
	});
	customerNormalStore.persistence.recipe.table.cookers.set([]);
	customerNormalStore.persistence.recipe.table.dlcs.set([]);
});
