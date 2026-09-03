/* eslint-disable @typescript-eslint/no-use-before-define -- Object methods intentionally call hoisted function declarations. */

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import {
	type TLegacyBeverageName,
	checkLegacyBeverageName,
	resolveLegacyBeverageName,
} from '@/domain/catalog/legacy/resolveLegacyBeverageName';
import {
	SUPPORTED_LEGACY_FOOD_NAMES,
	type TLegacyFoodName,
	checkLegacyFoodName,
	resolveLegacyFoodName,
} from '@/domain/catalog/legacy/resolveLegacyFoodName';
import {
	type TLegacyIngredientName,
	checkLegacyIngredientName,
	resolveLegacyIngredientNames,
} from '@/domain/catalog/legacy/resolveLegacyIngredientName';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import type { TFoodTagLabel } from '@/domain/data/tags/types';
import { RECOMMENDATION_SORT_PROFILES } from '@/domain/recommendations/sortProfiles';

import {
	checkLegacyPopularTag,
	checkPopularTag,
	resolveLegacyPopularTag,
} from '@/features/account/sync/serializers/tags';
import {
	isAllowedStringArray,
	isIntegerInRange,
	isStringArray,
} from '@/features/account/sync/serializers/utils';
import { migrateLegacyFoodTableColumnKeys } from '@/features/catalog/guests/shared/state/migrateLegacyFoodTableKeys';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '@/shared/utilities/state/persistedShape';
import { createVersionedMigrator } from '@/shared/utilities/state/versionedMigration';

import type {
	IGlobalPreferencesSetValueOrders,
	TGlobalPreferencesSnapshot,
} from './globalPreferencesTypes';

const beverageColumnKeyOrder = [
	'beverage',
	'price',
	'suitability',
	'action',
] as const;
const legacyFoodColumnKeyOrder = [
	'recipe',
	'cooker',
	'ingredient',
	'price',
	'suitability',
	'time',
	'action',
] as const;
const foodColumnKeyOrder = [
	'food',
	'cookerType',
	'ingredient',
	'price',
	'suitability',
	'time',
	'action',
] as const;
const beverageColumnKeys = new Set<string>(beverageColumnKeyOrder);
const foodColumnKeys = new Set<string>(foodColumnKeyOrder);
const legacyFoodColumnKeys = new Set<string>(legacyFoodColumnKeyOrder);
const currentRootKeys = new Set([
	'donationModal',
	'famousShop',
	'guestCardTagsTooltip',
	'hiddenItems',
	'highAppearance',
	'popularTrend',
	'suggestMeals',
	'table',
	'tachie',
	'vibrate',
]);
const donationModalKeys = new Set([
	'interactionCount',
	'lastMilestoneShown',
	'lastShown',
]);
const hiddenItemKeys = new Set(['dlcs']);
const popularTrendKeys = new Set(['isNegative', 'tag']);
const suggestMealsKeys = new Set([
	'enabled',
	'maxExtraIngredients',
	'maxRating',
	'maxResults',
	'sortProfile',
]);
const tableKeys = new Set(['columns', 'hiddenItems', 'row']);
const tableColumnKeys = new Set(['beverage', 'recipe']);
const tableHiddenItemKeys = new Set(['beverages', 'foods', 'ingredients']);
const dlcKeyOrder = Object.keys(DLC_LABEL_MAP).sort(
	(left, right) => Number(left) - Number(right)
);
const beverageOrder = BEVERAGE_LIST.map((item) => item.id);
const ingredientOrder = INGREDIENT_LIST.map((item) => item.id);
const foodOrder = FOOD_LIST.map((item) => item.id);
const dlcKeys = new Set(dlcKeyOrder);
const beverages: ReadonlySet<number> = new Set(beverageOrder);
const ingredients: ReadonlySet<number> = new Set(ingredientOrder);
const foods: ReadonlySet<number> = new Set(foodOrder);
const recommendationSortProfiles: ReadonlySet<string> = new Set(
	RECOMMENDATION_SORT_PROFILES
);

export const globalPreferencesSetValueOrders = {
	beverageColumns: beverageColumnKeyOrder,
	foodColumns: foodColumnKeyOrder,
	hiddenBeverages: beverageOrder,
	hiddenDlcs: dlcKeyOrder,
	hiddenFoods: foodOrder,
	hiddenIngredients: ingredientOrder,
} satisfies IGlobalPreferencesSetValueOrders;

function createDefaultGlobalPreferencesSnapshot(): TGlobalPreferencesSnapshot {
	return {
		donationModal: {
			interactionCount: 0,
			lastMilestoneShown: 0,
			lastShown: null,
		},
		famousShop: false,
		guestCardTagsTooltip: true,
		hiddenItems: { dlcs: [] },
		highAppearance: true,
		popularTrend: { isNegative: false, tag: null },
		suggestMeals: {
			enabled: true,
			maxExtraIngredients: null,
			maxRating: 4,
			maxResults: 10,
			sortProfile: 'material-cost-first',
		},
		table: {
			columns: {
				beverage: ['beverage', 'price', 'suitability', 'action'],
				recipe: [
					'food',
					'cookerType',
					'ingredient',
					'price',
					'suitability',
					'action',
				],
			},
			hiddenItems: { beverages: [], foods: [], ingredients: [] },
			row: 8,
		},
		tachie: true,
		vibrate: true,
	};
}

function checkExactKeys(data: Record<string, unknown>, keys: Set<string>) {
	const dataKeys = Object.keys(data);
	return (
		dataKeys.length === keys.size && dataKeys.every((key) => keys.has(key))
	);
}

function checkStringArray(
	data: unknown,
	values: ReadonlySet<string>,
	required: string[] = []
) {
	if (!isStringArray(data)) {
		return false;
	}
	if (!data.every((item) => values.has(item))) {
		return false;
	}
	return required.every((item) => data.includes(item));
}

function checkNumberArray(data: unknown, values: ReadonlySet<number>) {
	return (
		Array.isArray(data) &&
		data.every(
			(value) =>
				typeof value === 'number' &&
				Number.isSafeInteger(value) &&
				values.has(value)
		)
	);
}

function filterAllowedStringArray(data: unknown, values: ReadonlySet<string>) {
	return isStringArray(data) ? data.filter((item) => values.has(item)) : [];
}

function filterAllowedNumberArray(data: unknown, values: ReadonlySet<number>) {
	return Array.isArray(data)
		? data.filter(
				(value): value is number =>
					typeof value === 'number' &&
					Number.isSafeInteger(value) &&
					values.has(value)
			)
		: [];
}

function normalizeAllowedStringArray(
	data: unknown,
	values: ReadonlySet<string>,
	required: string[] = []
) {
	const present = new Set(filterAllowedStringArray(data, values));
	const requiredSet = new Set(required);

	return [...values].filter(
		(item) => present.has(item) || requiredSet.has(item)
	);
}

function normalizeAllowedNumberArray(
	data: unknown,
	values: ReadonlySet<number>
) {
	return [...new Set(filterAllowedNumberArray(data, values))];
}

function normalizeBoolean(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function normalizeNullableInteger(value: unknown, min: number, max: number) {
	return value === null || isIntegerInRange(value, min, max) ? value : null;
}

function getPlainObject(value: unknown): Record<string, unknown> {
	return isObjectTagRecord(value) ? value : {};
}

function migrateGlobalPreferencesV1ToV2(value: unknown) {
	const dataWithDefaults = applyGlobalPreferencesDefaults(
		value,
		createLegacyDefaults()
	);
	const legacyData = sanitizeLegacyGlobalPreferences(dataWithDefaults);
	if (!checkLegacyGlobalPreferencesMigrationInput(legacyData)) {
		return {};
	}
	try {
		return migrateLegacyGlobalPreferences(legacyData);
	} catch {
		return {};
	}
}

function migrateGlobalPreferencesV2ToV3(value: unknown) {
	const dataWithDefaults = applyGlobalPreferencesDefaults(
		value,
		createSchema2Defaults()
	);
	const migratedData = sanitizeGlobalPreferences(dataWithDefaults);
	if (!isObjectTagRecord(migratedData)) {
		return {};
	}
	const suggestMeals = getPlainObject(migratedData['suggestMeals']);
	return {
		...migratedData,
		suggestMeals: {
			...suggestMeals,
			maxResults: 10,
			sortProfile: 'material-cost-first',
		},
	};
}

const globalPreferencesMigrator = createVersionedMigrator({
	currentVersion: 3,
	migrations: {
		1: migrateGlobalPreferencesV1ToV2,
		2: migrateGlobalPreferencesV2ToV3,
	},
	minVersion: 1,
});

export const globalPreferencesShape = {
	createDefault: createDefaultGlobalPreferencesSnapshot,
	migrate(value: unknown, version: number): TGlobalPreferencesSnapshot {
		if (version !== 1 && version !== 2 && version !== 3) {
			throw new Error('unsupported-global-preferences-schema-version');
		}
		const migratedData = globalPreferencesMigrator(value, version);
		return globalPreferencesShape.normalize(migratedData);
	},
	normalize(value: unknown): TGlobalPreferencesSnapshot {
		const defaults = createDefaultGlobalPreferencesSnapshot();
		const record = getPlainObject(value);
		const defaultButCurrent = getPlainObject(defaults.suggestMeals);
		const donation = getPlainObject(record['donationModal']);
		const hiddenItems = getPlainObject(record['hiddenItems']);
		const popularTrend = getPlainObject(record['popularTrend']);
		const suggestMeals = getPlainObject(record['suggestMeals']);
		const table = getPlainObject(record['table']);
		const tableColumns = getPlainObject(table['columns']);
		const tableHiddenItems = getPlainObject(table['hiddenItems']);
		const fallbackSuggestMeals = getPlainObject(defaultButCurrent);

		const normalizedColumn = (
			columnValues: unknown,
			allowed: ReadonlySet<string>,
			required: string[]
		) => normalizeAllowedStringArray(columnValues, allowed, required);

		const result = {
			donationModal: {
				interactionCount: isNonNegativeSafeInteger(
					donation['interactionCount']
				)
					? donation['interactionCount']
					: defaults.donationModal.interactionCount,
				lastMilestoneShown: isNonNegativeSafeInteger(
					donation['lastMilestoneShown']
				)
					? donation['lastMilestoneShown']
					: defaults.donationModal.lastMilestoneShown,
				lastShown:
					donation['lastShown'] === null ||
					isNonNegativeSafeInteger(donation['lastShown'])
						? donation['lastShown']
						: defaults.donationModal.lastShown,
			},
			famousShop: normalizeBoolean(
				record['famousShop'],
				defaults.famousShop
			),
			guestCardTagsTooltip: normalizeBoolean(
				record['guestCardTagsTooltip'],
				defaults.guestCardTagsTooltip
			),
			hiddenItems: {
				dlcs: normalizeAllowedStringArray(hiddenItems['dlcs'], dlcKeys),
			},
			highAppearance: normalizeBoolean(
				record['highAppearance'],
				defaults.highAppearance
			),
			popularTrend: {
				isNegative: normalizeBoolean(
					popularTrend['isNegative'],
					defaults.popularTrend.isNegative
				),
				tag:
					popularTrend['tag'] === null ||
					checkPopularTag(popularTrend['tag'])
						? (popularTrend['tag'] ?? null)
						: null,
			},
			suggestMeals: {
				enabled: normalizeBoolean(
					suggestMeals['enabled'],
					fallbackSuggestMeals['enabled'] as boolean
				),
				maxExtraIngredients: normalizeNullableInteger(
					suggestMeals['maxExtraIngredients'],
					0,
					4
				),
				maxRating: isIntegerInRange(suggestMeals['maxRating'], 0, 4)
					? suggestMeals['maxRating']
					: (fallbackSuggestMeals['maxRating'] as number),
				maxResults: isIntegerInRange(suggestMeals['maxResults'], 5, 20)
					? suggestMeals['maxResults']
					: (fallbackSuggestMeals['maxResults'] as number),
				sortProfile:
					typeof suggestMeals['sortProfile'] === 'string' &&
					recommendationSortProfiles.has(suggestMeals['sortProfile'])
						? suggestMeals['sortProfile']
						: (fallbackSuggestMeals[
								'sortProfile'
							] as TGlobalPreferencesSnapshot['suggestMeals']['sortProfile']),
			},
			table: {
				columns: {
					beverage: normalizedColumn(
						tableColumns['beverage'],
						beverageColumnKeys,
						['beverage', 'action']
					),
					recipe: normalizedColumn(
						tableColumns['recipe'],
						foodColumnKeys,
						['food', 'action']
					),
				},
				hiddenItems: {
					beverages: normalizeAllowedNumberArray(
						tableHiddenItems['beverages'],
						beverages
					),
					foods: normalizeAllowedNumberArray(
						tableHiddenItems['foods'],
						foods
					),
					ingredients: normalizeAllowedNumberArray(
						tableHiddenItems['ingredients'],
						ingredients
					),
				},
				row: isIntegerInRange(table['row'], 5, 20)
					? table['row']
					: defaults.table.row,
			},
			tachie: normalizeBoolean(record['tachie'], defaults.tachie),
			vibrate: normalizeBoolean(record['vibrate'], defaults.vibrate),
		};

		return result as TGlobalPreferencesSnapshot;
	},
	validate(value: unknown): value is TGlobalPreferencesSnapshot {
		if (!isObjectTagRecord(value)) {
			return false;
		}
		const donationModal = getPlainObject(value['donationModal']);
		const hiddenItems = getPlainObject(value['hiddenItems']);
		const popularTrend = getPlainObject(value['popularTrend']);
		const suggestMeals = getPlainObject(value['suggestMeals']);
		const table = getPlainObject(value['table']);
		const tableColumns = getPlainObject(table['columns']);
		const tableHiddenItems = getPlainObject(table['hiddenItems']);

		return (
			checkExactKeys(value, currentRootKeys) &&
			checkExactKeys(donationModal, donationModalKeys) &&
			isNonNegativeSafeInteger(donationModal['interactionCount']) &&
			isNonNegativeSafeInteger(donationModal['lastMilestoneShown']) &&
			(donationModal['lastShown'] === null ||
				isNonNegativeSafeInteger(donationModal['lastShown'])) &&
			checkExactKeys(hiddenItems, hiddenItemKeys) &&
			isAllowedStringArray(hiddenItems['dlcs'], dlcKeys) &&
			typeof value['famousShop'] === 'boolean' &&
			typeof value['guestCardTagsTooltip'] === 'boolean' &&
			typeof value['highAppearance'] === 'boolean' &&
			checkExactKeys(popularTrend, popularTrendKeys) &&
			typeof popularTrend['isNegative'] === 'boolean' &&
			(popularTrend['tag'] === null ||
				checkPopularTag(popularTrend['tag'])) &&
			checkExactKeys(suggestMeals, suggestMealsKeys) &&
			typeof suggestMeals['enabled'] === 'boolean' &&
			(suggestMeals['maxExtraIngredients'] === null ||
				isIntegerInRange(suggestMeals['maxExtraIngredients'], 0, 4)) &&
			isIntegerInRange(suggestMeals['maxRating'], 0, 4) &&
			isIntegerInRange(suggestMeals['maxResults'], 5, 20) &&
			typeof suggestMeals['sortProfile'] === 'string' &&
			recommendationSortProfiles.has(suggestMeals['sortProfile']) &&
			checkExactKeys(table, tableKeys) &&
			isObjectTagRecord(tableColumns) &&
			checkExactKeys(tableColumns, tableColumnKeys) &&
			checkStringArray(tableColumns['beverage'], beverageColumnKeys, [
				'beverage',
				'action',
			]) &&
			checkStringArray(tableColumns['recipe'], foodColumnKeys, [
				'food',
				'action',
			]) &&
			isObjectTagRecord(tableHiddenItems) &&
			checkExactKeys(tableHiddenItems, tableHiddenItemKeys) &&
			checkNumberArray(tableHiddenItems['beverages'], beverages) &&
			checkNumberArray(tableHiddenItems['foods'], foods) &&
			checkNumberArray(tableHiddenItems['ingredients'], ingredients) &&
			isIntegerInRange(table['row'], 5, 20) &&
			typeof value['tachie'] === 'boolean' &&
			typeof value['vibrate'] === 'boolean'
		);
	},
} satisfies IPersistedShape<TGlobalPreferencesSnapshot>;

function applyGlobalPreferencesDefaults(
	data: unknown,
	defaults: unknown
): unknown {
	if (data === undefined) {
		return defaults;
	}
	if (!isObjectTagRecord(defaults)) {
		return data;
	}
	if (!isObjectTagRecord(data)) {
		return data;
	}

	const result = { ...data } as Record<string, unknown>;
	Object.keys(defaults).forEach((key) => {
		result[key] = applyGlobalPreferencesDefaults(data[key], defaults[key]);
	});
	return result;
}

function sanitizeGlobalPreferences(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return data;
	}
	const hiddenItems = getPlainObject(data['hiddenItems']);
	const popularTrend = getPlainObject(data['popularTrend']);
	const table = getPlainObject(data['table']);
	const tableColumns = getPlainObject(table['columns']);
	const tableHiddenItems = getPlainObject(table['hiddenItems']);

	return {
		...data,
		hiddenItems: {
			...hiddenItems,
			dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys),
		},
		popularTrend: {
			...popularTrend,
			tag: checkPopularTag(popularTrend['tag'])
				? popularTrend['tag']
				: null,
		},
		table: {
			...table,
			columns: {
				...tableColumns,
				beverage: filterAllowedStringArray(
					tableColumns['beverage'],
					beverageColumnKeys
				),
				recipe: filterAllowedStringArray(
					tableColumns['recipe'],
					foodColumnKeys
				),
			},
			hiddenItems: {
				...tableHiddenItems,
				beverages: filterAllowedNumberArray(
					tableHiddenItems['beverages'],
					beverages
				),
				foods: filterAllowedNumberArray(
					tableHiddenItems['foods'],
					foods
				),
				ingredients: filterAllowedNumberArray(
					tableHiddenItems['ingredients'],
					ingredients
				),
			},
		},
	};
}

function createSchema2Defaults() {
	const defaults = createDefaultGlobalPreferencesSnapshot();
	const { sortProfile: _sortProfile, ...suggestMeals } =
		defaults.suggestMeals;
	return { ...defaults, suggestMeals };
}

function createLegacyDefaults() {
	const defaults = createSchema2Defaults();
	const { guestCardTagsTooltip, ...legacyDefaults } = defaults;
	const legacyTable = {
		...defaults.table,
		columns: {
			...defaults.table.columns,
			recipe: legacyFoodColumnKeyOrder.filter((key) => key !== 'time'),
		},
	};
	return {
		...legacyDefaults,
		customerCardTagsTooltip: guestCardTagsTooltip,
		table: {
			...legacyTable,
			hiddenItems: { beverages: [], ingredients: [], recipes: [] },
		},
	};
}

function sanitizeLegacyGlobalPreferences(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return data;
	}
	const hiddenItems = getPlainObject(data['hiddenItems']);
	const popularTrend = getPlainObject(data['popularTrend']);
	const table = getPlainObject(data['table']);
	const tableColumns = getPlainObject(table['columns']);
	const tableHiddenItems = getPlainObject(table['hiddenItems']);

	return {
		...data,
		hiddenItems: {
			...hiddenItems,
			dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys),
		},
		popularTrend: {
			...popularTrend,
			tag: checkLegacyPopularTag(popularTrend['tag'])
				? popularTrend['tag']
				: null,
		},
		table: {
			...table,
			columns: {
				...tableColumns,
				beverage: filterAllowedStringArray(
					tableColumns['beverage'],
					beverageColumnKeys
				),
				recipe: filterAllowedStringArray(
					tableColumns['recipe'],
					legacyFoodColumnKeys
				),
			},
			hiddenItems: {
				...tableHiddenItems,
				beverages: Array.isArray(tableHiddenItems['beverages'])
					? tableHiddenItems['beverages']
					: [],
				ingredients: Array.isArray(tableHiddenItems['ingredients'])
					? tableHiddenItems['ingredients']
					: [],
				recipes: Array.isArray(tableHiddenItems['recipes'])
					? tableHiddenItems['recipes']
					: [],
			},
		},
	};
}

interface ILegacyGlobalPreferencesMigrationInput extends Record<
	string,
	unknown
> {
	customerCardTagsTooltip: boolean;
	popularTrend: Record<string, unknown> & { tag: TFoodTagLabel | null };
	table: Record<string, unknown> & {
		columns: Record<string, unknown> & { recipe: string[] };
		hiddenItems: {
			beverages: TLegacyBeverageName[];
			ingredients: TLegacyIngredientName[];
			recipes: TLegacyFoodName[];
		};
	};
}

function checkLegacyGlobalPreferencesMigrationInput(
	data: unknown
): data is ILegacyGlobalPreferencesMigrationInput {
	if (!isObjectTagRecord(data)) {
		return false;
	}
	const popularTrend = getPlainObject(data['popularTrend']);
	const table = getPlainObject(data['table']);
	const columns = getPlainObject(table['columns']);
	const hiddenItems = getPlainObject(table['hiddenItems']);
	if (
		typeof data['customerCardTagsTooltip'] !== 'boolean' ||
		(popularTrend['tag'] !== null &&
			!checkLegacyPopularTag(popularTrend['tag'])) ||
		!isStringArray(columns['recipe']) ||
		!columns['recipe'].every((key) => legacyFoodColumnKeys.has(key)) ||
		!isStringArray(hiddenItems['beverages']) ||
		!hiddenItems['beverages'].every(checkLegacyBeverageName) ||
		!isStringArray(hiddenItems['ingredients']) ||
		!hiddenItems['ingredients'].every(checkLegacyIngredientName) ||
		!isStringArray(hiddenItems['recipes']) ||
		!hiddenItems['recipes'].every(
			(name) =>
				checkLegacyFoodName(name) &&
				SUPPORTED_LEGACY_FOOD_NAMES.has(name)
		)
	) {
		return false;
	}
	return true;
}

function migrateLegacyGlobalPreferences(
	data: ILegacyGlobalPreferencesMigrationInput
) {
	const { customerCardTagsTooltip, popularTrend, table, ...currentData } =
		data;
	const { columns, hiddenItems } = table;
	const {
		beverages: legacyBeverages,
		ingredients: legacyIngredients,
		recipes: legacyRecipes,
		...legacyHiddenItems
	} = hiddenItems;
	return {
		...currentData,
		guestCardTagsTooltip: customerCardTagsTooltip,
		popularTrend: {
			...popularTrend,
			tag:
				popularTrend.tag === null
					? null
					: resolveLegacyPopularTag(popularTrend.tag),
		},
		table: {
			...table,
			columns: {
				...columns,
				recipe: migrateLegacyFoodTableColumnKeys(columns.recipe),
			},
			hiddenItems: {
				...legacyHiddenItems,
				beverages: legacyBeverages.map(resolveLegacyBeverageName),
				foods: legacyRecipes.map(resolveLegacyFoodName),
				ingredients: resolveLegacyIngredientNames(legacyIngredients),
			},
		},
	};
}
