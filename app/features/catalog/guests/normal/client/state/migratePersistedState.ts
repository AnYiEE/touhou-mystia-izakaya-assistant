import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { resolveLegacyCookerType } from '@/domain/catalog/legacy/resolveLegacyCookerType';
import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import type { TNormalGuestName } from '@/domain/data/guests/normal/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import { migrateLegacyNormalGuestMealsSnapshotV2ToV3 } from '@/features/account/sync/serializers/legacySavedMeals';
import { migrateMealFoodV1ToV2 } from '@/features/account/sync/serializers/meals';
import { NORMAL_GUEST_STORE_VERSION } from '@/features/catalog/guests/shared/state/guestStoreVersions';
import { migrateLegacyFoodTableSortDescriptor } from '@/features/catalog/guests/shared/state/migrateLegacyFoodTableKeys';

import { type normalGuestInitialState as state } from './initialState';

export function migrateNormalGuestPersistedState(
	persistedState: unknown,
	version: number
): typeof state {
	if (version >= NORMAL_GUEST_STORE_VERSION.recordIdentity) {
		return persistedState as typeof state;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < NORMAL_GUEST_STORE_VERSION.popular) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence = oldState.page;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.meals = oldState.page.selected;
		delete oldState.persistence.selected;
		delete oldState.page;
	}
	if (version < NORMAL_GUEST_STORE_VERSION.popularFull) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.ingredientLevel) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: {
				ingredient: { filters },
			},
		} = oldState;
		filters.levels = [];
	}
	if (version < NORMAL_GUEST_STORE_VERSION.rating) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.extraGuest) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: {
				customer: { filters },
			},
		} = oldState;
		filters.includes = [];
		filters.excludes = [];
	}
	if (version < NORMAL_GUEST_STORE_VERSION.dynamicMeal) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.showCooker) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.tableRows) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.ingredientTag) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: {
				ingredient: { filters },
			},
		} = oldState;
		filters.tags = [];
		filters.noTags = [];
	}
	if (version < NORMAL_GUEST_STORE_VERSION.removeBeverage) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.addBackBeverage) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.tablePersist) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.mealData) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.tableShare) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.deleteMealIndex) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.removeGuestSearchValue) {
		delete oldState.persistence.customer.searchValue;
	}
	if (version < NORMAL_GUEST_STORE_VERSION.availabilityDlcFilter) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.mealRecipeId) {
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
	if (version < NORMAL_GUEST_STORE_VERSION.recordIdentity) {
		oldState.persistence.meals =
			migrateLegacyNormalGuestMealsSnapshotV2ToV3(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				oldState.persistence.meals
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
		const normalGuestCatalog = NormalGuestCatalog.getInstance();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.includes = guestFilters.includes.map(
			(name: TNormalGuestName) =>
				resolveLegacyRecordName({
					catalog: normalGuestCatalog,
					category: 'normalGuest',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.excludes = guestFilters.excludes.map(
			(name: TNormalGuestName) =>
				resolveLegacyRecordName({
					catalog: normalGuestCatalog,
					category: 'normalGuest',
					name,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.noPlaces = guestFilters.noPlaces.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-normal-guest-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		guestFilters.places = guestFilters.places.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-normal-guest-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		ingredientFilters.noTags = ingredientFilters.noTags.map(
			(label: string) =>
				resolveLegacyTagLabel<TFoodTagId>({
					errorCode: 'invalid-legacy-normal-guest-filter-tag',
					facts: FOOD_TAG_MAP,
					label,
				})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		ingredientFilters.tags = ingredientFilters.tags.map((label: string) =>
			resolveLegacyTagLabel<TFoodTagId>({
				errorCode: 'invalid-legacy-normal-guest-filter-tag',
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
