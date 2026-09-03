import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { ALL_MAP_LABELS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type {
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import { normalGuestMealsShape } from '@/features/account/sync/shapes/normalGuestMeals';
import { specialGuestMealsShape } from '@/features/account/sync/shapes/specialGuestMeals';
import { specialGuestPlansShape } from '@/features/account/sync/shapes/specialGuestPlans';
import {
	type TTabVisibilityState,
	tabVisibilityStateMap,
} from '@/features/catalog/guests/shared/state/tabVisibility';
import type {
	ITableSortDescriptor,
	TBeverageTableSortKey,
	TFoodTableSortKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import {
	normalizeAllowedArray,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';
import type { ISpecialGuestPlansState } from '@/features/specialGuestPlans/contracts';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import { normalizeObjectByDefaults } from '@/shared/utilities/state/normalizeObjectByDefaults';
import type { ILocalPersistedShape } from '@/shared/utilities/state/persistedShape';

import {
	NORMAL_GUEST_STORE_VERSION,
	SPECIAL_GUEST_STORE_VERSION,
} from './guestStoreVersions';

const dlcFilterValues = toAllowedValueSet(Object.keys(DLC_LABEL_MAP));
const mapFilterValues = toAllowedValueSet(ALL_MAP_LABELS);
const normalGuestFilterValues = toAllowedValueSet(
	NormalGuestCatalog.getInstance().getValuesByProp('id')
);
const specialGuestFilterValues = toAllowedValueSet(
	SpecialGuestCatalog.getInstance().getValuesByProp('id')
);
const ingredientLevelFilterValues = toAllowedValueSet(
	IngredientCatalog.getInstance().getValuesByProp('level')
);
const foodTagFilterValues = toAllowedValueSet(
	Object.keys(FOOD_TAG_MAP).map(Number)
);
const foodCookerTypeFilterValues = toAllowedValueSet(
	FoodCatalog.getInstance().data.flatMap((food) =>
		food.recipes.map((recipe) => recipe.cookerType)
	)
);
const pinyinSortStateValues = new Set<number>(
	Object.values(PINYIN_SORT_STATE_MAP)
);
const tabVisibilityValues = new Set<string>(
	Object.values(tabVisibilityStateMap)
);

export type TBeverageTableSortDescriptor =
	ITableSortDescriptor<TBeverageTableSortKey>;
export type TFoodTableSortDescriptor = ITableSortDescriptor<TFoodTableSortKey>;

export interface INormalGuestPersistence extends Record<string, unknown> {
	beverage: Record<string, unknown> & {
		table: Record<string, unknown> & {
			availabilityDlcs: string[];
			sortDescriptor: TBeverageTableSortDescriptor;
		};
	};
	guest: Record<string, unknown> & {
		filters: Record<string, unknown> & {
			availabilityDlcs: string[];
			excludes: TNormalGuestId[];
			includes: TNormalGuestId[];
			noPlaces: TMapLabel[];
			places: TMapLabel[];
		};
		pinyinSortState: TPinyinSortState;
		tabVisibility: TTabVisibilityState;
	};
	ingredient: Record<string, unknown> & {
		filters: Record<string, unknown> & {
			availabilityDlcs: string[];
			levels: string[];
			noTags: TFoodTagId[];
			tags: TFoodTagId[];
		};
		pinyinSortState: TPinyinSortState;
		tabVisibility: TTabVisibilityState;
	};
	recipe: Record<string, unknown> & {
		table: Record<string, unknown> & {
			availabilityDlcs: string[];
			cookerTypes: TCookerTypeId[];
			sortDescriptor: TFoodTableSortDescriptor;
		};
	};
	meals: Partial<Record<TNormalGuestId, INormalGuestSavedMeal[]>>;
}

export interface ISpecialGuestPersistence extends Record<string, unknown> {
	beverage: Record<string, unknown> & {
		table: Record<string, unknown> & {
			availabilityDlcs: string[];
			sortDescriptor: TBeverageTableSortDescriptor;
		};
	};
	guest: Record<string, unknown> & {
		filters: Record<string, unknown> & {
			availabilityDlcs: string[];
			excludes: TSpecialGuestId[];
			includes: TSpecialGuestId[];
			noPlaces: TMapLabel[];
			places: TMapLabel[];
		};
		orderLinkedFilter: boolean;
		pinyinSortState: TPinyinSortState;
		showTagDescription: boolean;
		tabVisibility: TTabVisibilityState;
	};
	ingredient: Record<string, unknown> & {
		filters: Record<string, unknown> & {
			availabilityDlcs: string[];
			levels: string[];
			noTags: TFoodTagId[];
			tags: TFoodTagId[];
		};
		pinyinSortState: TPinyinSortState;
		tabVisibility: TTabVisibilityState;
	};
	recipe: Record<string, unknown> & {
		table: Record<string, unknown> & {
			availabilityDlcs: string[];
			cookerTypes: TCookerTypeId[];
			sortDescriptor: TFoodTableSortDescriptor;
		};
	};
	meals: Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>;
	plans: ISpecialGuestPlansState;
}

function normalizeByDefaults(value: unknown, defaults: unknown): unknown {
	if (defaults === undefined) {
		return value;
	}
	if (Array.isArray(defaults)) {
		return Array.isArray(value) ? value : defaults;
	}
	if (isObjectTagRecord(defaults)) {
		return normalizeObjectByDefaults(
			value,
			defaults,
			(_, currentValue, defaultValue) =>
				normalizeByDefaults(currentValue, defaultValue)
		);
	}
	if (
		typeof defaults === 'boolean' ||
		typeof defaults === 'number' ||
		typeof defaults === 'string'
	) {
		return typeof value === typeof defaults ? value : defaults;
	}
	return value === undefined ? defaults : value;
}

function normalizePinyinSortState(value: unknown): TPinyinSortState {
	return typeof value === 'number' && pinyinSortStateValues.has(value)
		? (value as TPinyinSortState)
		: PINYIN_SORT_STATE_MAP.none;
}

function normalizeTabVisibility(value: unknown): TTabVisibilityState {
	return typeof value === 'string' && tabVisibilityValues.has(value)
		? (value as TTabVisibilityState)
		: tabVisibilityStateMap.collapse;
}

function createNormalGuestDefault(): INormalGuestPersistence {
	return {
		beverage: { table: { availabilityDlcs: [], sortDescriptor: {} } },
		guest: {
			filters: {
				availabilityDlcs: [],
				excludes: [],
				includes: [],
				noPlaces: [],
				places: [],
			},
			pinyinSortState: PINYIN_SORT_STATE_MAP.none,
			tabVisibility: tabVisibilityStateMap.collapse,
		},
		ingredient: {
			filters: { availabilityDlcs: [], levels: [], noTags: [], tags: [] },
			pinyinSortState: PINYIN_SORT_STATE_MAP.none,
			tabVisibility: tabVisibilityStateMap.collapse,
		},
		meals: {},
		recipe: {
			table: {
				availabilityDlcs: [],
				cookerTypes: [],
				sortDescriptor: {},
			},
		},
	};
}

function createSpecialGuestDefault(): ISpecialGuestPersistence {
	return {
		beverage: { table: { availabilityDlcs: [], sortDescriptor: {} } },
		guest: {
			filters: {
				availabilityDlcs: [],
				excludes: [],
				includes: [],
				noPlaces: [],
				places: [],
			},
			orderLinkedFilter: true,
			pinyinSortState: PINYIN_SORT_STATE_MAP.none,
			showTagDescription: true,
			tabVisibility: tabVisibilityStateMap.collapse,
		},
		ingredient: {
			filters: { availabilityDlcs: [], levels: [], noTags: [], tags: [] },
			pinyinSortState: PINYIN_SORT_STATE_MAP.none,
			tabVisibility: tabVisibilityStateMap.collapse,
		},
		meals: {},
		plans: specialGuestPlansShape.createDefault(),
		recipe: {
			table: {
				availabilityDlcs: [],
				cookerTypes: [],
				sortDescriptor: {},
			},
		},
	};
}

function normalizeGuestFilters<
	TGuestId extends number,
	T extends {
		beverage: { table: { availabilityDlcs: string[] } };
		guest: {
			pinyinSortState: TPinyinSortState;
			tabVisibility: TTabVisibilityState;
			filters: {
				availabilityDlcs: string[];
				excludes: TGuestId[];
				includes: TGuestId[];
				noPlaces: TMapLabel[];
				places: TMapLabel[];
			};
		};
		ingredient: {
			pinyinSortState: TPinyinSortState;
			tabVisibility: TTabVisibilityState;
			filters: {
				availabilityDlcs: string[];
				levels: string[];
				noTags: TFoodTagId[];
				tags: TFoodTagId[];
			};
		};
		recipe: {
			table: { availabilityDlcs: string[]; cookerTypes: TCookerTypeId[] };
		};
	},
>(normalized: T, guestFilterValues: ReadonlySet<number | string>): T {
	return {
		...normalized,
		beverage: {
			...normalized.beverage,
			table: {
				...normalized.beverage.table,
				availabilityDlcs: normalizeAllowedArray<string>(
					normalized.beverage.table.availabilityDlcs,
					dlcFilterValues,
					'string'
				),
			},
		},
		guest: {
			...normalized.guest,
			filters: {
				...normalized.guest.filters,
				availabilityDlcs: normalizeAllowedArray<string>(
					normalized.guest.filters.availabilityDlcs,
					dlcFilterValues,
					'string'
				),
				excludes: normalizeAllowedArray<TGuestId>(
					normalized.guest.filters.excludes,
					guestFilterValues,
					'number'
				),
				includes: normalizeAllowedArray<TGuestId>(
					normalized.guest.filters.includes,
					guestFilterValues,
					'number'
				),
				noPlaces: normalizeAllowedArray<TMapLabel>(
					normalized.guest.filters.noPlaces,
					mapFilterValues,
					'string'
				),
				places: normalizeAllowedArray<TMapLabel>(
					normalized.guest.filters.places,
					mapFilterValues,
					'string'
				),
			},
			pinyinSortState: normalizePinyinSortState(
				normalized.guest.pinyinSortState
			),
			tabVisibility: normalizeTabVisibility(
				normalized.guest.tabVisibility
			),
		},
		ingredient: {
			...normalized.ingredient,
			filters: {
				...normalized.ingredient.filters,
				availabilityDlcs: normalizeAllowedArray<string>(
					normalized.ingredient.filters.availabilityDlcs,
					dlcFilterValues,
					'string'
				),
				levels: normalizeAllowedArray<string>(
					normalized.ingredient.filters.levels,
					ingredientLevelFilterValues,
					'string'
				),
				noTags: normalizeAllowedArray<TFoodTagId>(
					normalized.ingredient.filters.noTags,
					foodTagFilterValues,
					'number'
				),
				tags: normalizeAllowedArray<TFoodTagId>(
					normalized.ingredient.filters.tags,
					foodTagFilterValues,
					'number'
				),
			},
			pinyinSortState: normalizePinyinSortState(
				normalized.ingredient.pinyinSortState
			),
			tabVisibility: normalizeTabVisibility(
				normalized.ingredient.tabVisibility
			),
		},
		recipe: {
			...normalized.recipe,
			table: {
				...normalized.recipe.table,
				availabilityDlcs: normalizeAllowedArray<string>(
					normalized.recipe.table.availabilityDlcs,
					dlcFilterValues,
					'string'
				),
				cookerTypes: normalizeAllowedArray<TCookerTypeId>(
					normalized.recipe.table.cookerTypes,
					foodCookerTypeFilterValues,
					'number'
				),
			},
		},
	};
}

export const normalGuestPersistenceShape = {
	createDefault: createNormalGuestDefault,
	currentVersion: NORMAL_GUEST_STORE_VERSION.recordIdentity,
	normalize(value: unknown): INormalGuestPersistence {
		const record = isObjectTagRecord(value) ? value : {};
		const normalized = normalizeByDefaults(
			value,
			createNormalGuestDefault()
		) as INormalGuestPersistence;
		const filtered = normalizeGuestFilters(
			normalized,
			normalGuestFilterValues
		);
		return {
			...filtered,
			meals: normalGuestMealsShape.normalize(
				Object.hasOwn(record, 'meals')
					? record['meals']
					: filtered.meals
			),
		};
	},
	validate(value: unknown): value is INormalGuestPersistence {
		return (
			isObjectTagRecord(value) &&
			'meals' in value &&
			'beverage' in value &&
			'guest' in value &&
			'ingredient' in value &&
			'recipe' in value &&
			normalGuestMealsShape.validate(value['meals'])
		);
	},
} satisfies ILocalPersistedShape<INormalGuestPersistence>;

export const specialGuestPersistenceShape = {
	createDefault: createSpecialGuestDefault,
	currentVersion: SPECIAL_GUEST_STORE_VERSION.recordIdentity,
	normalize(value: unknown): ISpecialGuestPersistence {
		const record = isObjectTagRecord(value) ? value : {};
		const normalized = normalizeByDefaults(
			value,
			createSpecialGuestDefault()
		) as ISpecialGuestPersistence;
		const filtered = normalizeGuestFilters(
			normalized,
			specialGuestFilterValues
		);
		return {
			...filtered,
			meals: specialGuestMealsShape.normalize(
				Object.hasOwn(record, 'meals')
					? record['meals']
					: filtered.meals
			),
			plans: specialGuestPlansShape.normalize(
				Object.hasOwn(record, 'plans')
					? record['plans']
					: filtered.plans
			),
		};
	},
	validate(value: unknown): value is ISpecialGuestPersistence {
		return (
			isObjectTagRecord(value) &&
			'meals' in value &&
			'plans' in value &&
			'beverage' in value &&
			'guest' in value &&
			'ingredient' in value &&
			'recipe' in value &&
			specialGuestMealsShape.validate(value['meals']) &&
			specialGuestPlansShape.validate(value['plans'])
		);
	},
} satisfies ILocalPersistedShape<ISpecialGuestPersistence>;

export function normalizeNormalGuestRemotePartial(
	value: unknown
): Partial<INormalGuestPersistence> {
	const record = isObjectTagRecord(value) ? value : {};
	const { meals } = record;
	return Object.hasOwn(record, 'meals')
		? { meals: isObjectTagRecord(meals) ? meals : {} }
		: {};
}

export function normalizeSpecialGuestRemotePartial(
	value: unknown
): Partial<ISpecialGuestPersistence> {
	const record = isObjectTagRecord(value) ? value : {};
	const { guest: guestRecord, meals, plans } = record;
	const guest = isObjectTagRecord(guestRecord) ? guestRecord : {};
	return {
		...(typeof guest['orderLinkedFilter'] === 'boolean' ||
		typeof guest['showTagDescription'] === 'boolean'
			? {
					guest: {
						...(typeof guest['orderLinkedFilter'] === 'boolean'
							? { orderLinkedFilter: guest['orderLinkedFilter'] }
							: {}),
						...(typeof guest['showTagDescription'] === 'boolean'
							? {
									showTagDescription:
										guest['showTagDescription'],
								}
							: {}),
					},
				}
			: {}),
		...(Object.hasOwn(record, 'meals')
			? { meals: isObjectTagRecord(meals) ? meals : {} }
			: {}),
		...(Object.hasOwn(record, 'plans')
			? { plans: isObjectTagRecord(plans) ? plans : {} }
			: {}),
	} as unknown as Partial<ISpecialGuestPersistence>;
}
