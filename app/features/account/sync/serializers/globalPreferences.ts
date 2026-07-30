import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { RECIPE_LIST } from '@/domain/data/recipes/records';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TBeverageTableColumnKey,
	type TRecipeTableColumnKey,
} from '@/features/catalog/customers/shared/state/tableDescriptors';
import {
	readGlobalPreferencesPersistenceSource,
	replaceGlobalPreferencesPersistenceSnapshot,
} from '@/features/preferences/client/state/accountSync';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { cloneJsonObject } from '@/shared/utilities/objects/cloneJsonObject';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import type {
	IGlobalPreferencesSetValueOrders,
	TGlobalPreferencesSnapshot,
} from './globalPreferencesContracts';
import { mergeGlobalPreferencesSnapshots } from './globalPreferencesMerge';
import { checkPopularTag } from './tags';
import { isAllowedStringArray, isIntegerInRange, isStringArray } from './utils';

const beverageColumnKeyOrder = [
	'beverage',
	'price',
	'suitability',
	'action',
] as const;
const recipeColumnKeyOrder = [
	'recipe',
	'cooker',
	'ingredient',
	'price',
	'suitability',
	'time',
	'action',
] as const;
const beverageColumnKeys = new Set<string>(beverageColumnKeyOrder);
const recipeColumnKeys = new Set<string>(recipeColumnKeyOrder);
const rootKeys = new Set([
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
const tableHiddenItemKeys = new Set(['beverages', 'ingredients', 'recipes']);
const dlcKeyOrder = Object.keys(DLC_LABEL_MAP).sort(
	(left, right) => Number(left) - Number(right)
);
const beverageNameOrder = BEVERAGE_LIST.map((item) => item.name);
const ingredientNameOrder = INGREDIENT_LIST.map((item) => item.name);
const recipeNameOrder = RECIPE_LIST.map((item) => item.name);
const dlcKeys = new Set(dlcKeyOrder);
const beverageNames = new Set<string>(beverageNameOrder);
const ingredientNames = new Set<string>(ingredientNameOrder);
const recipeNames = new Set<string>(recipeNameOrder);
const globalPreferencesSetValueOrders = {
	beverageColumns: beverageColumnKeyOrder,
	hiddenBeverages: beverageNameOrder,
	hiddenDlcs: dlcKeyOrder,
	hiddenIngredients: ingredientNameOrder,
	hiddenRecipes: recipeNameOrder,
	recipeColumns: recipeColumnKeyOrder,
} satisfies IGlobalPreferencesSetValueOrders;

function checkExactKeys(data: Record<string, unknown>, keys: Set<string>) {
	const dataKeys = Object.keys(data);

	return (
		dataKeys.length === keys.size && dataKeys.every((key) => keys.has(key))
	);
}

function checkGlobalPreferencesExactKeyShape(data: unknown) {
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
		checkExactKeys(data, rootKeys) &&
		checkExactKeys(donationModal, donationModalKeys) &&
		checkExactKeys(hiddenItems, hiddenItemKeys) &&
		checkExactKeys(popularTrend, popularTrendKeys) &&
		checkExactKeys(suggestMeals, suggestMealsKeys) &&
		checkExactKeys(table, tableKeys) &&
		isObjectTagRecord(tableColumns) &&
		checkExactKeys(tableColumns, tableColumnKeys) &&
		isObjectTagRecord(tableHiddenItems) &&
		checkExactKeys(tableHiddenItems, tableHiddenItemKeys)
	);
}

function filterAllowedStringArray(data: unknown, values: Set<string>) {
	return isStringArray(data) ? data.filter((item) => values.has(item)) : data;
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
									recipeColumnKeys
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
									ingredientNames
								),
								recipes: filterAllowedStringArray(
									tableHiddenItems['recipes'],
									recipeNames
								),
							}
						: tableHiddenItems,
				}
			: table,
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

function isRecipeColumnArray(data: unknown): data is TRecipeTableColumnKey[] {
	return (
		isStringArray(data) && data.every((item) => recipeColumnKeys.has(item))
	);
}

export const globalPreferencesSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return {
			customerCardTagsTooltip: true,
			donationModal: {
				interactionCount: 0,
				lastMilestoneShown: 0,
				lastShown: null,
			},
			famousShop: false,
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
						'recipe',
						'cooker',
						'ingredient',
						'price',
						'suitability',
						'action',
					],
				},
				hiddenItems: { beverages: [], ingredients: [], recipes: [] },
				row: 8,
			},
			tachie: true,
			vibrate: true,
		};
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
			cloneJsonObject({
				customerCardTagsTooltip: persistence.customerCardTagsTooltip,
				donationModal: {
					interactionCount: donationModal['interactionCount'],
					lastMilestoneShown: donationModal['lastMilestoneShown'],
					lastShown: donationModal['lastShown'],
				},
				famousShop: persistence.famousShop,
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
						ingredients: tableHiddenItems['ingredients'],
						recipes: tableHiddenItems['recipes'],
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
		if (version !== 1) {
			throw new Error('unsupported-global-preferences-schema-version');
		}

		const dataWithDefaults = applyGlobalPreferencesDefaults(
			data,
			this.getDefaultSnapshot()
		);
		if (!checkGlobalPreferencesExactKeyShape(dataWithDefaults)) {
			throw new Error('invalid-global-preferences');
		}

		const sanitizedData = sanitizeGlobalPreferences(dataWithDefaults);
		if (!this.validate(sanitizedData)) {
			throw new Error('invalid-global-preferences');
		}

		return sanitizedData;
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
			checkGlobalPreferencesExactKeyShape(data) &&
			typeof data['customerCardTagsTooltip'] === 'boolean' &&
			isNonNegativeSafeInteger(donationModal['interactionCount']) &&
			isNonNegativeSafeInteger(donationModal['lastMilestoneShown']) &&
			(donationModal['lastShown'] === null ||
				isNonNegativeSafeInteger(donationModal['lastShown'])) &&
			typeof data['famousShop'] === 'boolean' &&
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
			isRecipeColumnArray(tableColumns['recipe']) &&
			isAllowedStringArray(
				tableHiddenItems['beverages'],
				beverageNames
			) &&
			isAllowedStringArray(
				tableHiddenItems['ingredients'],
				ingredientNames
			) &&
			isAllowedStringArray(tableHiddenItems['recipes'], recipeNames) &&
			isIntegerInRange(table['row'], 5, 20) &&
			typeof data['tachie'] === 'boolean' &&
			typeof data['vibrate'] === 'boolean'
		);
	},
} satisfies ISyncNamespaceSerializer<TGlobalPreferencesSnapshot>;
