import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { resolveLegacyCookerType } from '@/domain/catalog/legacy/resolveLegacyCookerType';
import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import type { TSpecialGuestName } from '@/domain/data/guests/special/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import { migrateLegacySpecialGuestMealsSnapshotV2ToV3 } from '@/features/account/sync/serializers/legacySavedMeals';
import { migrateMealFoodV1ToV2 } from '@/features/account/sync/serializers/meals';
import {
	migrateLegacySpecialGuestPlansSnapshotV1ToV2,
	migrateLegacySpecialGuestPlansSnapshotV2ToV3,
	migrateLegacySpecialGuestPlansSnapshotV3ToV4,
} from '@/features/account/sync/serializers/specialGuestPlansMerge';
import { migrateLegacyFoodTableSortDescriptor } from '@/features/catalog/guests/shared/state/migrateLegacyFoodTableKeys';

import { type specialGuestInitialState as state } from './initialState';

export const SPECIAL_GUEST_STORE_VERSION = {
	initial: 0,
	rating: 1, // eslint-disable-next-line sort-keys
	popular: 2,
	popularTypo: 3,
	price: 4, // eslint-disable-next-line sort-keys
	cooker: 5,
	ingredientLevel: 6,
	tagDescription: 7, // eslint-disable-next-line sort-keys
	extraGuest: 8,
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
	removeGuestSearchValue: 21, // eslint-disable-next-line sort-keys
	plans: 22, // eslint-disable-next-line sort-keys
	planGuestSort: 23,
	virtualPlans: 24, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 25,
	mealRecipeId: 26,
	recordIdentity: 27,
} as const;

const storeVersion = SPECIAL_GUEST_STORE_VERSION;

export function migrateSpecialGuestPersistedState(
	persistedState: unknown,
	version: number
) {
	if (version >= storeVersion.recordIdentity) {
		return persistedState as typeof state;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
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
			persistence: { customer: guest },
		} = oldState;
		guest.showTagDescription = true;
	}
	if (version < storeVersion.extraGuest) {
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
			persistence: { customer: guest },
		} = oldState;
		guest.orderLinkedFilter = true;
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
			persistence: { customer: guest },
		} = oldState;
		guest.showTachie = true;
	}
	if (version < storeVersion.moveTachie) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { customer: guest },
		} = oldState;
		delete guest.showTachie;
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
				recipe: { table: foodTable },
			},
		} = oldState;
		if (beverageTable.rows === 7) {
			beverageTable.rows = 8;
		}
		if (foodTable.rows === 7) {
			foodTable.rows = 8;
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
				recipe: { table: foodTable },
			},
		} = oldState;
		beverageTable.dlcs = [];
		beverageTable.sortDescriptor = {};
		foodTable.cookers = [];
		foodTable.dlcs = [];
		foodTable.sortDescriptor = {};
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
				const { extraIngredients, recipe: legacyFoodName } = meal;
				meal.recipe = {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					extraIngredients, // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					name: legacyFoodName,
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
				recipe: { table: foodTable },
			},
		} = oldState;
		delete beverageTable.rows;
		delete beverageTable.visibleColumns;
		delete foodTable.rows;
		delete foodTable.visibleColumns;
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
	if (version < storeVersion.removeGuestSearchValue) {
		delete oldState.persistence.customer.searchValue;
	}
	if (version < storeVersion.plans) {
		oldState.persistence.plans = { activeId: null, items: [] };
	}
	if (version < storeVersion.planGuestSort) {
		oldState.persistence.plans =
			migrateLegacySpecialGuestPlansSnapshotV1ToV2(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				oldState.persistence.plans
			);
	}
	if (version < storeVersion.virtualPlans) {
		oldState.persistence.plans =
			migrateLegacySpecialGuestPlansSnapshotV2ToV3(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				oldState.persistence.plans
			);
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
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				meal.recipe = migrateMealFoodV1ToV2(meal.recipe);
			}
		}
	}
	if (version < storeVersion.recordIdentity) {
		oldState.persistence.meals =
			migrateLegacySpecialGuestMealsSnapshotV2ToV3(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				oldState.persistence.meals
			);
		oldState.persistence.plans =
			migrateLegacySpecialGuestPlansSnapshotV3ToV4(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				oldState.persistence.plans
			);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { persistence } = oldState;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filters: guestFilters } = persistence.customer;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filters: ingredientFilters } = persistence.ingredient;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { table: foodTable } = persistence.recipe;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		foodTable.cookers = foodTable.cookers.map(resolveLegacyCookerType);
		const specialGuestCatalog = SpecialGuestCatalog.getInstance();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.includes = guestFilters.includes.map(
			(name: TSpecialGuestName) =>
				resolveLegacyRecordName({
					catalog: specialGuestCatalog,
					category: 'specialGuest',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.excludes = guestFilters.excludes.map(
			(name: TSpecialGuestName) =>
				resolveLegacyRecordName({
					catalog: specialGuestCatalog,
					category: 'specialGuest',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.noPlaces = guestFilters.noPlaces.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-special-guest-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.places = guestFilters.places.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-special-guest-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		ingredientFilters.noTags = ingredientFilters.noTags.map(
			(label: string) =>
				resolveLegacyTagLabel<TFoodTagId>({
					errorCode: 'invalid-legacy-special-guest-filter-tag',
					facts: FOOD_TAG_MAP,
					label,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		ingredientFilters.tags = ingredientFilters.tags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-special-guest-filter-tag',
				facts: FOOD_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		persistence.guest = persistence.customer;
		delete persistence.customer;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		foodTable.cookerTypes = foodTable.cookers;
		delete foodTable.cookers;
		foodTable.sortDescriptor = migrateLegacyFoodTableSortDescriptor(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			foodTable.sortDescriptor
		);
	}
	return oldState as typeof state;
}
