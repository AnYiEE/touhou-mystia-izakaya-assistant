import {
	BEVERAGE_LIST,
	DLC_LABEL_MAP,
	INGREDIENT_LIST,
	RECIPE_LIST,
	type TBeverageName,
	type TIngredientName,
	type TRecipeName,
} from '@/data';
import type {
	TBeverageTableColumnKey,
	TRecipeTableColumnKey,
} from '@/(pages)/customer-shared/types';
import { type ISyncNamespaceSerializer } from '@/lib/account/sync';
import { globalStore } from '@/stores/global';
import { type IPopularTrend } from '@/types';
import { cloneJsonObject } from '@/utilities';
import { checkPopularTag } from './tags';
import { isPlainObject, isStringArray, mergeFieldMap } from './utils';

export interface IGlobalPreferencesSnapshot {
	customerCardTagsTooltip: boolean;
	donationModal: {
		interactionCount: number;
		lastMilestoneShown: number;
		lastShown: number | null;
	};
	famousShop: boolean;
	hiddenItems: { dlcs: string[] };
	highAppearance: boolean;
	popularTrend: IPopularTrend;
	suggestMeals: {
		enabled: boolean;
		maxExtraIngredients: number | null;
		maxRating: number;
		maxResults: number;
	};
	table: {
		columns: {
			beverage: TBeverageTableColumnKey[];
			recipe: TRecipeTableColumnKey[];
		};
		hiddenItems: {
			beverages: TBeverageName[];
			ingredients: TIngredientName[];
			recipes: TRecipeName[];
		};
		row: number;
	};
	tachie: boolean;
	vibrate: boolean;
}

const beverageColumnKeys = new Set<string>([
	'beverage',
	'price',
	'suitability',
	'action',
]);
const recipeColumnKeys = new Set<string>([
	'recipe',
	'cooker',
	'ingredient',
	'price',
	'suitability',
	'action',
	'time',
]);
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
const dlcKeys = new Set(Object.keys(DLC_LABEL_MAP));
const beverageNames = new Set<string>(BEVERAGE_LIST.map((item) => item.name));
const ingredientNames = new Set<string>(
	INGREDIENT_LIST.map((item) => item.name)
);
const recipeNames = new Set<string>(RECIPE_LIST.map((item) => item.name));

function checkExactKeys(data: Record<string, unknown>, keys: Set<string>) {
	const dataKeys = Object.keys(data);

	return (
		dataKeys.length === keys.size && dataKeys.every((key) => keys.has(key))
	);
}

function checkGlobalPreferencesExactKeyShape(data: unknown) {
	if (!isPlainObject(data)) {
		return false;
	}

	const { donationModal, hiddenItems, popularTrend, suggestMeals, table } =
		data;
	if (
		!isPlainObject(donationModal) ||
		!isPlainObject(hiddenItems) ||
		!isPlainObject(popularTrend) ||
		!isPlainObject(suggestMeals) ||
		!isPlainObject(table)
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
		isPlainObject(tableColumns) &&
		checkExactKeys(tableColumns, tableColumnKeys) &&
		isPlainObject(tableHiddenItems) &&
		checkExactKeys(tableHiddenItems, tableHiddenItemKeys)
	);
}

function isAllowedStringArray(data: unknown, values: Set<string>) {
	return isStringArray(data) && data.every((item) => values.has(item));
}

function isIntegerInRange(data: unknown, min: number, max: number) {
	return (
		typeof data === 'number' &&
		Number.isInteger(data) &&
		data >= min &&
		data <= max
	);
}

function filterAllowedStringArray(data: unknown, values: Set<string>) {
	return isStringArray(data) ? data.filter((item) => values.has(item)) : data;
}

function isNonNegativeSafeInteger(data: unknown) {
	return isIntegerInRange(data, 0, Number.MAX_SAFE_INTEGER);
}

function sanitizeGlobalPreferences(data: unknown) {
	if (!isPlainObject(data)) {
		return data;
	}

	const { hiddenItems, popularTrend, table } = data;
	const tableColumns = isPlainObject(table) ? table['columns'] : null;
	const tableHiddenItems = isPlainObject(table) ? table['hiddenItems'] : null;

	return {
		...data,
		hiddenItems: isPlainObject(hiddenItems)
			? { dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys) }
			: hiddenItems,
		popularTrend: isPlainObject(popularTrend)
			? {
					...popularTrend,
					tag: checkPopularTag(popularTrend['tag'])
						? popularTrend['tag']
						: null,
				}
			: popularTrend,
		table: isPlainObject(table)
			? {
					...table,
					columns: isPlainObject(tableColumns)
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
					hiddenItems: isPlainObject(tableHiddenItems)
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

	if (!isPlainObject(defaults)) {
		return data;
	}

	if (!isPlainObject(data)) {
		return data;
	}

	const result = { ...data };
	Object.keys(defaults).forEach((key) => {
		result[key] = applyGlobalPreferencesDefaults(data[key], defaults[key]);
	});

	return result;
}

function getPlainObjectOrEmpty(data: unknown): Record<string, unknown> {
	return isPlainObject(data) ? data : {};
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

function normalizeInteractionCountToCloud(
	data: IGlobalPreferencesSnapshot,
	cloud: IGlobalPreferencesSnapshot | null
) {
	if (cloud === null) {
		return data;
	}

	return {
		...data,
		donationModal: {
			...data.donationModal,
			interactionCount: cloud.donationModal.interactionCount,
		},
	};
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
		const persistence = globalStore.persistence.get();
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
	merge({ allowBaseNullAutoMerge, base, cloud, local, namespace }) {
		const normalizedBase =
			base === null
				? null
				: normalizeInteractionCountToCloud(base, cloud);
		const normalizedLocal = normalizeInteractionCountToCloud(local, cloud);

		return mergeFieldMap<IGlobalPreferencesSnapshot>({
			allowBaseNullAutoMerge,
			base: normalizedBase,
			cloud,
			defaults: this.getDefaultSnapshot(),
			local: normalizedLocal,
			namespace,
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
		globalStore.persistence.assign({
			customerCardTagsTooltip: data.customerCardTagsTooltip,
			donationModal: data.donationModal,
			famousShop: data.famousShop,
			hiddenItems: data.hiddenItems,
			highAppearance: data.highAppearance,
			popularTrend: data.popularTrend,
			suggestMeals: data.suggestMeals,
			table: data.table,
			tachie: data.tachie,
			vibrate: data.vibrate,
		});
	},
	validate(data): data is IGlobalPreferencesSnapshot {
		if (!isPlainObject(data)) {
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
			!isPlainObject(donationModal) ||
			!isPlainObject(hiddenItems) ||
			!isPlainObject(popularTrend) ||
			!isPlainObject(suggestMeals) ||
			!isPlainObject(table)
		) {
			return false;
		}

		const tableColumns = table['columns'];
		const tableHiddenItems = table['hiddenItems'];
		if (!isPlainObject(tableColumns) || !isPlainObject(tableHiddenItems)) {
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
} satisfies ISyncNamespaceSerializer<IGlobalPreferencesSnapshot>;
