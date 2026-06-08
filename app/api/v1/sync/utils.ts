import { DLC_LABEL_MAP } from '@/data';
import { THEME_MAP } from '@/design/hooks/use-theme/constants';
import { type TUserState, type TUserStateNew } from '@/lib/db/types';
import {
	type ISyncStateChange,
	type ISyncStatePutBody,
	type ISyncStateRecord,
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
	checkPopularTag,
	checkRecipeTag,
} from '@/lib/account/sync/serializers/tags';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);
const MAX_SYNC_CHANGE_BYTES = 1024 * 1024;
export const MAX_SYNC_JSON_BODY_BYTES =
	MAX_SYNC_CHANGE_BYTES * SYNC_NAMESPACE_SET.size + 16 * 1024;
const beverageNames = new Set<string>(Beverage.getInstance().getNames());
const customerNormalNames = new Set<string>(
	CustomerNormal.getInstance().getNames()
);
const customerRareNames = new Set<string>(
	CustomerRare.getInstance().getNames()
);
const ingredientNames = new Set<string>(Ingredient.getInstance().getNames());
const recipeNames = new Set<string>(Recipe.getInstance().getNames());
const dlcKeys = new Set<string>(Object.keys(DLC_LABEL_MAP));
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
const themeValues = new Set<string>(Object.values(THEME_MAP));

function isPlainObject(data: unknown): data is Record<string, unknown> {
	return data !== null && !Array.isArray(data) && typeof data === 'object';
}

function hasExactKeys(data: Record<string, unknown>, keys: string[]) {
	const actualKeys = Object.keys(data);
	if (actualKeys.length !== keys.length) {
		return false;
	}

	const actualKeySet = new Set(actualKeys);

	return keys.every((key) => actualKeySet.has(key));
}

function isStringArray(data: unknown): data is string[] {
	return (
		Array.isArray(data) && data.every((item) => typeof item === 'string')
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

function isNonNegativeSafeInteger(data: unknown): data is number {
	return typeof data === 'number' && Number.isSafeInteger(data) && data >= 0;
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
		hasExactKeys(data, [
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
		]) &&
		hasExactKeys(donationModal, [
			'interactionCount',
			'lastMilestoneShown',
			'lastShown',
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
		isIntegerInRange(
			donationModal['interactionCount'],
			0,
			Number.MAX_SAFE_INTEGER
		) &&
		isIntegerInRange(
			donationModal['lastMilestoneShown'],
			0,
			Number.MAX_SAFE_INTEGER
		) &&
		(donationModal['lastShown'] === null ||
			isIntegerInRange(
				donationModal['lastShown'],
				0,
				Number.MAX_SAFE_INTEGER
			)) &&
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
		isStringArray(tableColumns['beverage']) &&
		tableColumns['beverage'].every((item) =>
			beverageColumnKeys.has(item)
		) &&
		isStringArray(tableColumns['recipe']) &&
		tableColumns['recipe'].every((item) => recipeColumnKeys.has(item)) &&
		isAllowedStringArray(tableHiddenItems['beverages'], beverageNames) &&
		isAllowedStringArray(
			tableHiddenItems['ingredients'],
			ingredientNames
		) &&
		isAllowedStringArray(tableHiddenItems['recipes'], recipeNames) &&
		isIntegerInRange(table['row'], 5, 20) &&
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
		!isNonNegativeSafeInteger(body['state_epoch']) ||
		!('changes' in body) ||
		!Array.isArray(body['changes'])
	) {
		return null;
	}

	if (body['changes'].length > SYNC_NAMESPACE_SET.size) {
		return null;
	}

	const changes: ISyncStateChange[] = [];
	const seenNamespaces = new Set<TSyncNamespace>();
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
			!isNonNegativeSafeInteger(change['revision']) ||
			change['revision'] >= Number.MAX_SAFE_INTEGER ||
			!('schema_version' in change) ||
			change['schema_version'] !==
				SYNC_SCHEMA_VERSION_MAP[change['namespace']]
		) {
			return null;
		}
		if (seenNamespaces.has(change['namespace'])) {
			return null;
		}
		seenNamespaces.add(change['namespace']);

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

export function parseUserStateData(
	record: Pick<TUserState, 'data' | 'namespace' | 'schema_version'>
) {
	if (
		!checkSyncNamespace(record.namespace) ||
		record.schema_version !== SYNC_SCHEMA_VERSION_MAP[record.namespace]
	) {
		throw new Error('invalid-user-state-data');
	}

	const data: unknown = JSON.parse(record.data);
	const change = {
		data,
		namespace: record.namespace,
		revision: 0,
		schema_version: record.schema_version,
	} satisfies ISyncStateChange;
	if (!validateSyncStateData(change)) {
		throw new Error('invalid-user-state-data');
	}

	return data;
}

export function parseUserStateRecord(record: TUserState): ISyncStateRecord {
	if (
		!isNonNegativeSafeInteger(record.revision) ||
		record.revision >= Number.MAX_SAFE_INTEGER ||
		!isNonNegativeSafeInteger(record.updated_at)
	) {
		throw new Error('invalid-user-state-data');
	}

	return {
		data: parseUserStateData(record),
		namespace: record.namespace,
		revision: record.revision,
		schema_version: record.schema_version,
		updated_at: record.updated_at,
	};
}
