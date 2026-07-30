import { migrateCustomerRarePlansSnapshot } from '@/features/account/sync/serializers/customerRarePlansMerge';

import { type customerRareInitialState as state } from './initialState';

export const CUSTOMER_RARE_STORE_VERSION = {
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
	tableShare: 19, // eslint-disable-next-line sort-keys
	deleteMealIndex: 20,
	removeCustomerSearchValue: 21, // eslint-disable-next-line sort-keys
	plans: 22, // eslint-disable-next-line sort-keys
	planCustomerSort: 23,
	virtualPlans: 24, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 25,
} as const;

const storeVersion = CUSTOMER_RARE_STORE_VERSION;

export function migrateCustomerRarePersistedState(
	persistedState: unknown,
	version: number
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = persistedState as any;
	if (version < storeVersion.rating) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.page.selected
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				meal.rating = 'exgood';
			}
		}
	}
	if (version < storeVersion.popular) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence = oldState.page;
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.selected
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				meal.hasMystiaKitchenware = false;
				meal.order = { beverageTag: null, recipeTag: null };
				meal.popular = { isNegative: false, tag: null };
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.meals = oldState.page.selected;
		delete oldState.persistence.selected;
		delete oldState.page;
	}
	if (version < storeVersion.popularTypo) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				meal.hasMystiaKitchenware = meal.hasMystiaKitchenwware;
				// cSpell:ignore kitchenwware
				delete meal.hasMystiaKitchenwware;
			}
		}
	}
	if (version < storeVersion.price) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				meal.price = 0;
			}
		}
	}
	if (version < storeVersion.cooker) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
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
				ingredient: { filters },
			},
		} = oldState;
		filters.levels = [];
	}
	if (version < storeVersion.tagDescription) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { customer },
		} = oldState;
		customer.showTagDescription = true;
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
	if (version < storeVersion.linkedFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { customer },
		} = oldState;
		customer.orderLinkedFilter = true;
	}
	if (version < storeVersion.mystiaCooker) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
			for (const meal of meals) {
				if (meal.hasMystiaCooker) {
					meal.order.beverageTag = null;
					meal.order.recipeTag = null;
				}
			}
		}
	}
	if (version < storeVersion.dynamicMeal) {
		for (const meals of Object.values(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			oldState.persistence.meals
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		) as any) {
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
			persistence: { customer },
		} = oldState;
		customer.showTachie = true;
	}
	if (version < storeVersion.moveTachie) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { customer },
		} = oldState;
		delete customer.showTachie;
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
	if (version < storeVersion.plans) {
		oldState.persistence.plans = { activeId: null, items: [] };
	}
	if (version < storeVersion.planCustomerSort) {
		const plans: unknown = oldState?.persistence?.plans;
		if (
			plans !== null &&
			typeof plans === 'object' &&
			!Array.isArray(plans) &&
			'items' in plans &&
			Array.isArray(plans.items)
		) {
			for (const plan of plans.items) {
				if (
					plan !== null &&
					typeof plan === 'object' &&
					!Array.isArray(plan)
				) {
					Object.assign(plan, { customerSort: 'default' });
				}
			}
		}
	}
	if (version < storeVersion.virtualPlans) {
		const persistence: unknown = oldState?.persistence;
		if (
			persistence !== null &&
			typeof persistence === 'object' &&
			!Array.isArray(persistence) &&
			'plans' in persistence
		) {
			persistence.plans = migrateCustomerRarePlansSnapshot(
				persistence.plans,
				2
			);
		}
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
	return persistedState as typeof state;
}
