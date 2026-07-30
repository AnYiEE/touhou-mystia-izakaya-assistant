import { Recipe } from '@/domain/catalog/food/Recipe';

import { type customerNormalInitialState as state } from './initialState';

export const CUSTOMER_NORMAL_STORE_VERSION = {
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
	removeCustomerSearchValue: 16, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 17,
	mealRecipeId: 18,
} as const;

const storeVersion = CUSTOMER_NORMAL_STORE_VERSION;
const recipeInstance = Recipe.getInstance();

export function migrateCustomerNormalPersistedState(
	persistedState: unknown,
	version: number
): typeof state {
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
				visibleColumns: ['action', 'beverage', 'price', 'suitability'],
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
				const { extraIngredients, recipe: recipeName } = meal;
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
	if (version < storeVersion.removeCustomerSearchValue) {
		delete oldState.persistence.customer.searchValue;
	}
	if (version < storeVersion.availabilityDlcFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.beverage.table.availabilityDlcs =
			oldState.persistence.beverage.table.dlcs;
		delete oldState.persistence.beverage.table.dlcs;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.customer.filters.availabilityDlcs =
			oldState.persistence.customer.filters.dlcs;
		delete oldState.persistence.customer.filters.dlcs;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.ingredient.filters.availabilityDlcs =
			oldState.persistence.ingredient.filters.dlcs;
		delete oldState.persistence.ingredient.filters.dlcs;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.recipe.table.availabilityDlcs =
			oldState.persistence.recipe.table.dlcs;
		delete oldState.persistence.recipe.table.dlcs;
	}
	if (version < storeVersion.mealRecipeId) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				const recipeName: unknown = meal?.recipe?.name;
				const recipe =
					typeof recipeName === 'string'
						? recipeInstance.data.find(
								({ name }) => name === recipeName
							)
						: undefined;
				if (recipe !== undefined) {
					meal.recipe.recipeId = recipe.recipes[0].id;
				}
			}
		}
	}
	return persistedState as typeof state;
}
