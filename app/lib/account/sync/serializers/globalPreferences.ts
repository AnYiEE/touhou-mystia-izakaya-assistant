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
import { isPlainObject, isStringArray, mergeFieldMap } from './utils';

export interface IGlobalPreferencesSnapshot {
	customerCardTagsTooltip: boolean;
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
	'famousShop',
	'hiddenItems',
	'highAppearance',
	'popularTrend',
	'suggestMeals',
	'table',
	'tachie',
	'vibrate',
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

	const { hiddenItems, popularTrend, suggestMeals, table } = data;
	if (
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

function sanitizeGlobalPreferences(data: unknown) {
	if (!isPlainObject(data)) {
		return data;
	}

	const { hiddenItems, table } = data;
	const tableHiddenItems = isPlainObject(table) ? table['hiddenItems'] : null;

	return {
		...data,
		hiddenItems: isPlainObject(hiddenItems)
			? { dlcs: filterAllowedStringArray(hiddenItems['dlcs'], dlcKeys) }
			: hiddenItems,
		table: isPlainObject(table)
			? {
					...table,
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
		return cloneJsonObject({
			customerCardTagsTooltip:
				globalStore.persistence.customerCardTagsTooltip.get(),
			famousShop: globalStore.persistence.famousShop.get(),
			hiddenItems: {
				dlcs: globalStore.persistence.hiddenItems.dlcs.get(),
			},
			highAppearance: globalStore.persistence.highAppearance.get(),
			popularTrend: globalStore.persistence.popularTrend.get(),
			suggestMeals: {
				enabled: globalStore.persistence.suggestMeals.enabled.get(),
				maxExtraIngredients:
					globalStore.persistence.suggestMeals.maxExtraIngredients.get(),
				maxRating: globalStore.persistence.suggestMeals.maxRating.get(),
				maxResults:
					globalStore.persistence.suggestMeals.maxResults.get(),
			},
			table: {
				columns: {
					beverage:
						globalStore.persistence.table.columns.beverage.get(),
					recipe: globalStore.persistence.table.columns.recipe.get(),
				},
				hiddenItems: {
					beverages:
						globalStore.persistence.table.hiddenItems.beverages.get(),
					ingredients:
						globalStore.persistence.table.hiddenItems.ingredients.get(),
					recipes:
						globalStore.persistence.table.hiddenItems.recipes.get(),
				},
				row: globalStore.persistence.table.row.get(),
			},
			tachie: globalStore.persistence.tachie.get(),
			vibrate: globalStore.persistence.vibrate.get(),
		});
	},
	merge({ base, cloud, local }) {
		return {
			conflict: null,
			...mergeFieldMap({
				base,
				cloud,
				defaults: this.getDefaultSnapshot(),
				local,
			}),
		};
	},
	migrate(data) {
		if (!checkGlobalPreferencesExactKeyShape(data)) {
			throw new Error('invalid-global-preferences');
		}

		const sanitizedData = sanitizeGlobalPreferences(data);
		if (!this.validate(sanitizedData)) {
			throw new Error('invalid-global-preferences');
		}

		return sanitizedData;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		globalStore.persistence.customerCardTagsTooltip.set(
			data.customerCardTagsTooltip
		);
		globalStore.persistence.hiddenItems.dlcs.set(data.hiddenItems.dlcs);
		globalStore.persistence.suggestMeals.enabled.set(
			data.suggestMeals.enabled
		);
		globalStore.persistence.suggestMeals.maxExtraIngredients.set(
			data.suggestMeals.maxExtraIngredients
		);
		globalStore.persistence.suggestMeals.maxRating.set(
			data.suggestMeals.maxRating
		);
		globalStore.persistence.suggestMeals.maxResults.set(
			data.suggestMeals.maxResults
		);
		globalStore.persistence.table.columns.beverage.set(
			data.table.columns.beverage
		);
		globalStore.persistence.table.columns.recipe.set(
			data.table.columns.recipe
		);
		globalStore.persistence.table.hiddenItems.beverages.set(
			data.table.hiddenItems.beverages
		);
		globalStore.persistence.table.hiddenItems.ingredients.set(
			data.table.hiddenItems.ingredients
		);
		globalStore.persistence.table.hiddenItems.recipes.set(
			data.table.hiddenItems.recipes
		);
		globalStore.persistence.table.row.set(data.table.row);
		globalStore.persistence.famousShop.set(data.famousShop);
		globalStore.persistence.popularTrend.set(data.popularTrend);
		globalStore.persistence.highAppearance.set(data.highAppearance);
		globalStore.persistence.tachie.set(data.tachie);
		globalStore.persistence.vibrate.set(data.vibrate);
	},
	validate(data): data is IGlobalPreferencesSnapshot {
		if (!isPlainObject(data)) {
			return false;
		}

		const { hiddenItems, popularTrend, suggestMeals, table } = data;
		if (
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
			typeof data['famousShop'] === 'boolean' &&
			isAllowedStringArray(hiddenItems['dlcs'], dlcKeys) &&
			typeof data['highAppearance'] === 'boolean' &&
			typeof popularTrend['isNegative'] === 'boolean' &&
			(popularTrend['tag'] === null ||
				typeof popularTrend['tag'] === 'string') &&
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
