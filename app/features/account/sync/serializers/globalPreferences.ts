import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import {
	SUPPORTED_LEGACY_INGREDIENT_NAMES,
	type TLegacyIngredientName,
	resolveLegacyIngredientNames,
} from '@/domain/catalog/legacy/resolveLegacyIngredientName';
import { resolveLegacyRecordName } from '@/domain/catalog/legacy/resolveLegacyRecordName';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import type { TBeverageName } from '@/domain/data/beverages/types';
import { FOOD_LIST } from '@/domain/data/foods/records';
import type { TFoodName } from '@/domain/data/foods/types';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import type { TFoodTagLabel } from '@/domain/data/tags/types';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import { migrateLegacyFoodTableColumnKeys } from '@/features/catalog/guests/shared/state/migrateLegacyFoodTableKeys';
import {
	type TBeverageTableColumnKey,
	type TFoodTableColumnKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import {
	readGlobalPreferencesPersistenceSource,
	replaceGlobalPreferencesPersistenceSnapshot,
} from '@/features/preferences/client/state/accountSync';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import type {
	IGlobalPreferencesSetValueOrders,
	TGlobalPreferencesSnapshot,
} from './globalPreferencesContracts';
import { mergeGlobalPreferencesSnapshots } from './globalPreferencesMerge';
import {
	checkLegacyPopularTag,
	checkPopularTag,
	resolveLegacyPopularTag,
} from './tags';
import { isAllowedStringArray, isIntegerInRange, isStringArray } from './utils';

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
const legacyRootKeys = new Set([
	'customerCardTagsTooltip',
	'donationModal',
	'famousShop',
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
]);
const tableKeys = new Set(['columns', 'hiddenItems', 'row']);
const tableColumnKeys = new Set(['beverage', 'recipe']);
const tableHiddenItemKeys = new Set(['beverages', 'foods', 'ingredients']);
const legacyTableHiddenItemKeys = new Set([
	'beverages',
	'ingredients',
	'recipes',
]);
const dlcKeyOrder = Object.keys(DLC_LABEL_MAP).sort(
	(left, right) => Number(left) - Number(right)
);
const beverageNameOrder = BEVERAGE_LIST.map((item) => item.name);
const beverageOrder = BEVERAGE_LIST.map((item) => item.id);
const ingredientOrder = INGREDIENT_LIST.map((item) => item.id);
const foodNameOrder = FOOD_LIST.map((item) => item.name);
const foodOrder = FOOD_LIST.map((item) => item.id);
const dlcKeys = new Set(dlcKeyOrder);
const beverageNames = new Set(beverageNameOrder);
const beverages: ReadonlySet<number> = new Set(beverageOrder);
const ingredients: ReadonlySet<number> = new Set(ingredientOrder);
const foodNames = new Set(foodNameOrder);
const foods: ReadonlySet<number> = new Set(foodOrder);
const globalPreferencesSetValueOrders = {
	beverageColumns: beverageColumnKeyOrder,
	foodColumns: foodColumnKeyOrder,
	hiddenBeverages: beverageOrder,
	hiddenDlcs: dlcKeyOrder,
	hiddenFoods: foodOrder,
	hiddenIngredients: ingredientOrder,
} satisfies IGlobalPreferencesSetValueOrders;

interface ILegacyGlobalPreferencesMigrationInput extends Record<
	string,
	unknown
> {
	customerCardTagsTooltip: boolean;
	popularTrend: Record<string, unknown> & { tag: TFoodTagLabel | null };
	table: Record<string, unknown> & {
		columns: Record<string, unknown> & { recipe: string[] };
		hiddenItems: {
			beverages: TBeverageName[];
			ingredients: TLegacyIngredientName[];
			recipes: TFoodName[];
		};
	};
}

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
			maxResults: 5,
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

function checkGlobalPreferencesExactKeyShape(data: unknown, version: 1 | 2) {
	if (!isObjectTagRecord(data)) {
		return false;
	}

	const { donationModal, hiddenItems, popularTrend, suggestMeals, table } =
		data;
	if (
		!isObjectTagRecord(donationModal) ||
		!isObjectTagRecord(hiddenItems) ||
		!isObjectTagRecord(popularTrend) ||
		!isObjectTagRecord(suggestMeals) ||
		!isObjectTagRecord(table)
	) {
		return false;
	}

	const tableColumns = table['columns'];
	const tableHiddenItems = table['hiddenItems'];

	return (
		checkExactKeys(
			data,
			version === 2 ? currentRootKeys : legacyRootKeys
		) &&
		checkExactKeys(donationModal, donationModalKeys) &&
		checkExactKeys(hiddenItems, hiddenItemKeys) &&
		checkExactKeys(popularTrend, popularTrendKeys) &&
		checkExactKeys(suggestMeals, suggestMealsKeys) &&
		checkExactKeys(table, tableKeys) &&
		isObjectTagRecord(tableColumns) &&
		checkExactKeys(tableColumns, tableColumnKeys) &&
		isObjectTagRecord(tableHiddenItems) &&
		checkExactKeys(
			tableHiddenItems,
			version === 1 ? legacyTableHiddenItemKeys : tableHiddenItemKeys
		)
	);
}

function filterAllowedStringArray(data: unknown, values: ReadonlySet<string>) {
	return isStringArray(data) ? data.filter((item) => values.has(item)) : data;
}

function filterAllowedNumberArray(data: unknown, values: ReadonlySet<number>) {
	return Array.isArray(data)
		? data.filter(
				(value): value is number =>
					typeof value === 'number' &&
					Number.isSafeInteger(value) &&
					values.has(value)
			)
		: data;
}

function isAllowedNameArray<TName extends string>(
	data: unknown,
	values: ReadonlySet<string>
): data is TName[] {
	return isStringArray(data) && data.every((value) => values.has(value));
}

function sanitizeGlobalPreferences(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return data;
	}

	const { hiddenItems, popularTrend, table } = data;
	const tableColumns = isObjectTagRecord(table) ? table['columns'] : null;
	const tableHiddenItems = isObjectTagRecord(table)
		? table['hiddenItems']
		: null;

	return {
		...data,
		hiddenItems: isObjectTagRecord(hiddenItems)
			? { dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys) }
			: hiddenItems,
		popularTrend: isObjectTagRecord(popularTrend)
			? {
					...popularTrend,
					tag: checkPopularTag(popularTrend['tag'])
						? popularTrend['tag']
						: null,
				}
			: popularTrend,
		table: isObjectTagRecord(table)
			? {
					...table,
					columns: isObjectTagRecord(tableColumns)
						? {
								beverage: filterAllowedStringArray(
									tableColumns['beverage'],
									beverageColumnKeys
								),
								recipe: filterAllowedStringArray(
									tableColumns['recipe'],
									foodColumnKeys
								),
							}
						: tableColumns,
					hiddenItems: isObjectTagRecord(tableHiddenItems)
						? {
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
							}
						: tableHiddenItems,
				}
			: table,
	};
}

function sanitizeLegacyGlobalPreferences(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return data;
	}

	const { hiddenItems, popularTrend, table } = data;
	const tableColumns = isObjectTagRecord(table) ? table['columns'] : null;
	const tableHiddenItems = isObjectTagRecord(table)
		? table['hiddenItems']
		: null;

	return {
		...data,
		hiddenItems: isObjectTagRecord(hiddenItems)
			? { dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys) }
			: hiddenItems,
		popularTrend: isObjectTagRecord(popularTrend)
			? {
					...popularTrend,
					tag: checkLegacyPopularTag(popularTrend['tag'])
						? popularTrend['tag']
						: null,
				}
			: popularTrend,
		table: isObjectTagRecord(table)
			? {
					...table,
					columns: isObjectTagRecord(tableColumns)
						? {
								beverage: filterAllowedStringArray(
									tableColumns['beverage'],
									beverageColumnKeys
								),
								recipe: filterAllowedStringArray(
									tableColumns['recipe'],
									legacyFoodColumnKeys
								),
							}
						: tableColumns,
					hiddenItems: isObjectTagRecord(tableHiddenItems)
						? {
								beverages: filterAllowedStringArray(
									tableHiddenItems['beverages'],
									beverageNames
								),
								ingredients: filterAllowedStringArray(
									tableHiddenItems['ingredients'],
									SUPPORTED_LEGACY_INGREDIENT_NAMES
								),
								recipes: filterAllowedStringArray(
									tableHiddenItems['recipes'],
									foodNames
								),
							}
						: tableHiddenItems,
				}
			: table,
	};
}

function isAllowedNumberArray(data: unknown, values: ReadonlySet<number>) {
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

function getLegacyDefaults() {
	const defaults = createDefaultGlobalPreferencesSnapshot();
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

function checkLegacyGlobalPreferencesMigrationInput(
	data: unknown
): data is ILegacyGlobalPreferencesMigrationInput {
	if (!isObjectTagRecord(data)) {
		return false;
	}

	const { popularTrend, table } = data;
	if (!isObjectTagRecord(popularTrend) || !isObjectTagRecord(table)) {
		return false;
	}

	const { columns, hiddenItems } = table;
	if (!isObjectTagRecord(columns) || !isObjectTagRecord(hiddenItems)) {
		return false;
	}

	return (
		typeof data['customerCardTagsTooltip'] === 'boolean' &&
		(popularTrend['tag'] === null ||
			checkLegacyPopularTag(popularTrend['tag'])) &&
		isStringArray(columns['recipe']) &&
		columns['recipe'].every((key) => legacyFoodColumnKeys.has(key)) &&
		isAllowedNameArray<TBeverageName>(
			hiddenItems['beverages'],
			beverageNames
		) &&
		isAllowedNameArray<TLegacyIngredientName>(
			hiddenItems['ingredients'],
			SUPPORTED_LEGACY_INGREDIENT_NAMES
		) &&
		isAllowedNameArray<TFoodName>(hiddenItems['recipes'], foodNames)
	);
}

function migrateLegacyGlobalPreferences(
	data: ILegacyGlobalPreferencesMigrationInput
) {
	const { customerCardTagsTooltip, popularTrend, table, ...currentData } =
		data;
	const { columns, hiddenItems } = table;
	const beverageCatalog = BeverageCatalog.getInstance();
	const foodCatalog = FoodCatalog.getInstance();

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
				beverages: hiddenItems.beverages.map((name) =>
					resolveLegacyRecordName({
						catalog: beverageCatalog,
						category: 'beverage',
						name,
					})
				),
				foods: hiddenItems.recipes.map((name) =>
					resolveLegacyRecordName({
						catalog: foodCatalog,
						category: 'food',
						name,
					})
				),
				ingredients: resolveLegacyIngredientNames(
					hiddenItems.ingredients
				),
			},
		},
	};
}

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

	const result = { ...data };
	Object.keys(defaults).forEach((key) => {
		result[key] = applyGlobalPreferencesDefaults(data[key], defaults[key]);
	});

	return result;
}

function getPlainObjectOrEmpty(data: unknown): Record<string, unknown> {
	return isObjectTagRecord(data) ? data : {};
}

function isBeverageColumnArray(
	data: unknown
): data is TBeverageTableColumnKey[] {
	return (
		isStringArray(data) &&
		data.every((item) => beverageColumnKeys.has(item))
	);
}

function isFoodColumnArray(data: unknown): data is TFoodTableColumnKey[] {
	return (
		isStringArray(data) && data.every((item) => foodColumnKeys.has(item))
	);
}

export const globalPreferencesSerializer = {
	deserialize(data) {
		return this.migrate(
			data,
			SYNC_SCHEMA_VERSION_MAP[SYNC_NAMESPACE_MAP.globalPreferences]
		);
	},
	getDefaultSnapshot() {
		return createDefaultGlobalPreferencesSnapshot();
	},
	getLocalSnapshot() {
		const persistence = readGlobalPreferencesPersistenceSource();
		const donationModal = getPlainObjectOrEmpty(persistence.donationModal);
		const hiddenItems = getPlainObjectOrEmpty(persistence.hiddenItems);
		const suggestMeals = getPlainObjectOrEmpty(persistence.suggestMeals);
		const table = getPlainObjectOrEmpty(persistence.table);
		const tableColumns = getPlainObjectOrEmpty(table['columns']);
		const tableHiddenItems = getPlainObjectOrEmpty(table['hiddenItems']);

		const snapshot = sanitizeGlobalPreferences(
			structuredClone({
				donationModal: {
					interactionCount: donationModal['interactionCount'],
					lastMilestoneShown: donationModal['lastMilestoneShown'],
					lastShown: donationModal['lastShown'],
				},
				famousShop: persistence.famousShop,
				guestCardTagsTooltip: persistence.guestCardTagsTooltip,
				hiddenItems: { dlcs: hiddenItems['dlcs'] },
				highAppearance: persistence.highAppearance,
				popularTrend: persistence.popularTrend,
				suggestMeals: {
					enabled: suggestMeals['enabled'],
					maxExtraIngredients: suggestMeals['maxExtraIngredients'],
					maxRating: suggestMeals['maxRating'],
					maxResults: suggestMeals['maxResults'],
				},
				table: {
					columns: {
						beverage: tableColumns['beverage'],
						recipe: tableColumns['recipe'],
					},
					hiddenItems: {
						beverages: tableHiddenItems['beverages'],
						foods: tableHiddenItems['foods'],
						ingredients: tableHiddenItems['ingredients'],
					},
					row: table['row'],
				},
				tachie: persistence.tachie,
				vibrate: persistence.vibrate,
			})
		);

		return this.validate(snapshot) ? snapshot : this.getDefaultSnapshot();
	},
	merge({ base, cloud, local, namespace }) {
		return mergeGlobalPreferencesSnapshots({
			base,
			cloud,
			defaults: this.getDefaultSnapshot(),
			local,
			namespace,
			setValueOrders: globalPreferencesSetValueOrders,
		});
	},
	migrate(data, version) {
		if (version !== 1 && version !== 2) {
			throw new Error('unsupported-global-preferences-schema-version');
		}

		const dataWithDefaults = applyGlobalPreferencesDefaults(
			data,
			version === 2 ? this.getDefaultSnapshot() : getLegacyDefaults()
		);
		if (!checkGlobalPreferencesExactKeyShape(dataWithDefaults, version)) {
			throw new Error('invalid-global-preferences');
		}

		let migratedData: unknown;
		if (version === 1) {
			const legacyData =
				sanitizeLegacyGlobalPreferences(dataWithDefaults);
			if (!checkLegacyGlobalPreferencesMigrationInput(legacyData)) {
				throw new Error('invalid-global-preferences');
			}
			migratedData = migrateLegacyGlobalPreferences(legacyData);
		} else {
			migratedData = sanitizeGlobalPreferences(dataWithDefaults);
		}
		if (!this.validate(migratedData)) {
			throw new Error('invalid-global-preferences');
		}

		return migratedData;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		replaceGlobalPreferencesPersistenceSnapshot(data);
	},
	validate(data): data is TGlobalPreferencesSnapshot {
		if (!isObjectTagRecord(data)) {
			return false;
		}

		const {
			donationModal,
			hiddenItems,
			popularTrend,
			suggestMeals,
			table,
		} = data;
		if (
			!isObjectTagRecord(donationModal) ||
			!isObjectTagRecord(hiddenItems) ||
			!isObjectTagRecord(popularTrend) ||
			!isObjectTagRecord(suggestMeals) ||
			!isObjectTagRecord(table)
		) {
			return false;
		}

		const tableColumns = table['columns'];
		const tableHiddenItems = table['hiddenItems'];
		if (
			!isObjectTagRecord(tableColumns) ||
			!isObjectTagRecord(tableHiddenItems)
		) {
			return false;
		}

		return (
			checkGlobalPreferencesExactKeyShape(data, 2) &&
			isNonNegativeSafeInteger(donationModal['interactionCount']) &&
			isNonNegativeSafeInteger(donationModal['lastMilestoneShown']) &&
			(donationModal['lastShown'] === null ||
				isNonNegativeSafeInteger(donationModal['lastShown'])) &&
			typeof data['famousShop'] === 'boolean' &&
			typeof data['guestCardTagsTooltip'] === 'boolean' &&
			isAllowedStringArray(hiddenItems['dlcs'], dlcKeys) &&
			typeof data['highAppearance'] === 'boolean' &&
			typeof popularTrend['isNegative'] === 'boolean' &&
			(popularTrend['tag'] === null ||
				checkPopularTag(popularTrend['tag'])) &&
			typeof suggestMeals['enabled'] === 'boolean' &&
			(suggestMeals['maxExtraIngredients'] === null ||
				isIntegerInRange(suggestMeals['maxExtraIngredients'], 0, 4)) &&
			isIntegerInRange(suggestMeals['maxRating'], 0, 4) &&
			isIntegerInRange(suggestMeals['maxResults'], 1, 10) &&
			isBeverageColumnArray(tableColumns['beverage']) &&
			isFoodColumnArray(tableColumns['recipe']) &&
			isAllowedNumberArray(tableHiddenItems['beverages'], beverages) &&
			isAllowedNumberArray(tableHiddenItems['foods'], foods) &&
			isAllowedNumberArray(
				tableHiddenItems['ingredients'],
				ingredients
			) &&
			isIntegerInRange(table['row'], 5, 20) &&
			typeof data['tachie'] === 'boolean' &&
			typeof data['vibrate'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<TGlobalPreferencesSnapshot>;
