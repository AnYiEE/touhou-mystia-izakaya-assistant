import { type TUserStateNew } from '@/lib/db/types';
import {
	type ISyncStateChange,
	type ISyncStatePutBody,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import {
	Beverage,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Recipe,
} from '@/utils';
import {
	checkBeverageTag,
	checkRecipeTag,
} from '@/lib/account/sync/serializers/tags';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);
const MAX_SYNC_CHANGE_BYTES = 1024 * 1024;
const beverageNames = new Set<string>(Beverage.getInstance().getNames());
const customerNormalNames = new Set<string>(
	CustomerNormal.getInstance().getNames()
);
const customerRareNames = new Set<string>(
	CustomerRare.getInstance().getNames()
);
const ingredientNames = new Set<string>(Ingredient.getInstance().getNames());
const recipeNames = new Set<string>(Recipe.getInstance().getNames());
const beverageColumnKeys = new Set([
	'beverage',
	'price',
	'suitability',
	'action',
]);
const recipeColumnKeys = new Set([
	'recipe',
	'cooker',
	'ingredient',
	'price',
	'suitability',
	'action',
	'time',
]);
const themeValues = new Set(['light', 'dark', 'system']);

function isPlainObject(data: unknown): data is Record<string, unknown> {
	return data !== null && !Array.isArray(data) && typeof data === 'object';
}

function hasExactKeys(data: Record<string, unknown>, keys: string[]) {
	const actualKeys = Object.keys(data);

	return (
		actualKeys.length === keys.length &&
		keys.every((key) => actualKeys.includes(key))
	);
}

function isStringArray(data: unknown): data is string[] {
	return (
		Array.isArray(data) && data.every((item) => typeof item === 'string')
	);
}

function validateMealRecipe(data: unknown) {
	return (
		isPlainObject(data) &&
		hasExactKeys(data, ['extraIngredients', 'name']) &&
		typeof data['name'] === 'string' &&
		recipeNames.has(data['name']) &&
		Array.isArray(data['extraIngredients']) &&
		data['extraIngredients'].every(
			(ingredient) =>
				typeof ingredient === 'string' &&
				ingredientNames.has(ingredient)
		)
	);
}

function validateCustomerNormalMeal(data: unknown) {
	return (
		isPlainObject(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null ||
			(typeof data['beverage'] === 'string' &&
				beverageNames.has(data['beverage']))) &&
		validateMealRecipe(data['recipe'])
	);
}

function validateCustomerRareMeal(data: unknown) {
	return (
		isPlainObject(data) &&
		hasExactKeys(data, [
			'beverage',
			'hasMystiaCooker',
			'order',
			'recipe',
		]) &&
		typeof data['beverage'] === 'string' &&
		beverageNames.has(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isPlainObject(data['order']) &&
		hasExactKeys(data['order'], ['beverageTag', 'recipeTag']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkRecipeTag(data['order']['recipeTag'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function validateMealSnapshot(
	data: unknown,
	{
		customerNames,
		validateMeal,
	}: { customerNames: Set<string>; validateMeal: (data: unknown) => boolean }
) {
	return (
		isPlainObject(data) &&
		Object.entries(data).every(
			([customerName, meals]) =>
				customerNames.has(customerName) &&
				Array.isArray(meals) &&
				meals.every(validateMeal)
		)
	);
}

function validateGlobalPreferences(data: unknown) {
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
		hasExactKeys(data, [
			'customerCardTagsTooltip',
			'famousShop',
			'hiddenItems',
			'highAppearance',
			'popularTrend',
			'suggestMeals',
			'table',
			'tachie',
			'vibrate',
		]) &&
		hasExactKeys(hiddenItems, ['dlcs']) &&
		hasExactKeys(popularTrend, ['isNegative', 'tag']) &&
		hasExactKeys(suggestMeals, [
			'enabled',
			'maxExtraIngredients',
			'maxRating',
			'maxResults',
		]) &&
		hasExactKeys(table, ['columns', 'hiddenItems', 'row']) &&
		isPlainObject(tableColumns) &&
		hasExactKeys(tableColumns, ['beverage', 'recipe']) &&
		isPlainObject(tableHiddenItems) &&
		hasExactKeys(tableHiddenItems, [
			'beverages',
			'ingredients',
			'recipes',
		]) &&
		typeof data['customerCardTagsTooltip'] === 'boolean' &&
		typeof data['famousShop'] === 'boolean' &&
		isStringArray(hiddenItems['dlcs']) &&
		typeof data['highAppearance'] === 'boolean' &&
		typeof popularTrend['isNegative'] === 'boolean' &&
		(popularTrend['tag'] === null ||
			typeof popularTrend['tag'] === 'string') &&
		typeof suggestMeals['enabled'] === 'boolean' &&
		(suggestMeals['maxExtraIngredients'] === null ||
			typeof suggestMeals['maxExtraIngredients'] === 'number') &&
		typeof suggestMeals['maxRating'] === 'number' &&
		typeof suggestMeals['maxResults'] === 'number' &&
		isStringArray(tableColumns['beverage']) &&
		tableColumns['beverage'].every((item) =>
			beverageColumnKeys.has(item)
		) &&
		isStringArray(tableColumns['recipe']) &&
		tableColumns['recipe'].every((item) => recipeColumnKeys.has(item)) &&
		isStringArray(tableHiddenItems['beverages']) &&
		isStringArray(tableHiddenItems['ingredients']) &&
		isStringArray(tableHiddenItems['recipes']) &&
		typeof table['row'] === 'number' &&
		typeof data['tachie'] === 'boolean' &&
		typeof data['vibrate'] === 'boolean'
	);
}

function validateSyncStateData(change: ISyncStateChange) {
	if (change.namespace === SYNC_NAMESPACE_MAP.customerNormalMeals) {
		return validateMealSnapshot(change.data, {
			customerNames: customerNormalNames,
			validateMeal: validateCustomerNormalMeal,
		});
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRareMeals) {
		return validateMealSnapshot(change.data, {
			customerNames: customerRareNames,
			validateMeal: validateCustomerRareMeal,
		});
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRareSettings) {
		return (
			isPlainObject(change.data) &&
			hasExactKeys(change.data, [
				'orderLinkedFilter',
				'showTagDescription',
			]) &&
			typeof change.data['orderLinkedFilter'] === 'boolean' &&
			typeof change.data['showTagDescription'] === 'boolean'
		);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.globalPreferences) {
		return validateGlobalPreferences(change.data);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.theme) {
		return typeof change.data === 'string' && themeValues.has(change.data);
	}

	return (
		isPlainObject(change.data) &&
		hasExactKeys(change.data, ['completed']) &&
		typeof change.data['completed'] === 'boolean'
	);
}

export function checkSyncNamespace(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

export function parseSyncStatePutBody(
	body: unknown,
	allowedExtraRootKeys: string[] = []
) {
	const rootKeys = ['changes', 'state_epoch', ...allowedExtraRootKeys];
	if (
		!isPlainObject(body) ||
		!hasExactKeys(body, rootKeys) ||
		!('state_epoch' in body) ||
		typeof body['state_epoch'] !== 'number' ||
		!Number.isInteger(body['state_epoch']) ||
		!('changes' in body) ||
		!Array.isArray(body['changes'])
	) {
		return null;
	}

	if (body['changes'].length > SYNC_NAMESPACE_SET.size) {
		return null;
	}

	const changes: ISyncStateChange[] = [];
	const namespaceSet = new Set<TSyncNamespace>();
	for (const change of body['changes']) {
		if (
			!isPlainObject(change) ||
			!hasExactKeys(change, [
				'data',
				'namespace',
				'revision',
				'schema_version',
			]) ||
			!('data' in change) ||
			!('namespace' in change) ||
			!checkSyncNamespace(change['namespace']) ||
			!('revision' in change) ||
			typeof change['revision'] !== 'number' ||
			!Number.isInteger(change['revision']) ||
			change['revision'] < 0 ||
			!('schema_version' in change) ||
			change['schema_version'] !==
				SYNC_SCHEMA_VERSION_MAP[change['namespace']]
		) {
			return null;
		}
		if (namespaceSet.has(change['namespace'])) {
			return null;
		}
		namespaceSet.add(change['namespace']);

		const parsedChange = {
			data: change['data'],
			namespace: change['namespace'],
			revision: change['revision'],
			schema_version: change['schema_version'],
		} satisfies ISyncStateChange;

		if (!validateSyncStateData(parsedChange)) {
			return null;
		}
		try {
			if (
				new Blob([JSON.stringify(parsedChange.data)]).size >
				MAX_SYNC_CHANGE_BYTES
			) {
				return null;
			}
		} catch {
			return null;
		}

		changes.push(parsedChange);
	}

	return {
		changes,
		state_epoch: body['state_epoch'],
	} satisfies ISyncStatePutBody;
}

export function createUserStateRecord(
	userId: string,
	change: ISyncStateChange,
	revision: number,
	updatedAt: number
): TUserStateNew | null {
	try {
		return {
			data: JSON.stringify(change.data),
			namespace: change.namespace,
			revision,
			schema_version: change.schema_version,
			updated_at: updatedAt,
			user_id: userId,
		};
	} catch {
		return null;
	}
}

export function parseUserStateData(data: string) {
	try {
		return JSON.parse(data);
	} catch {
		return null;
	}
}
