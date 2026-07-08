import { ALL_PLACES_SET, DLC_LABEL_MAP } from '@/data';
import { THEME_MAP } from '@/design/hooks/use-theme/constants';
import {
	type ISyncStateChange,
	type ISyncStatePutBody,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { MAX_SYNC_CHANGE_BYTES } from '@/lib/account/shared/requestLimits';
import {
	checkBeverageTag,
	checkPopularTag,
	checkRecipeTag,
} from '@/lib/account/sync/serializers/tags';
import {
	hasExactKeys,
	isAllowedStringArray,
	isIntegerInRange,
	isNonNegativeSafeInteger,
	isPlainObject,
	isStringArray,
} from '@/lib/account/sync/serializers/utils';
import {
	Beverage,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Recipe,
} from '@/utils';
import { CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH } from '@/utils/customer/shared/customerRarePlanConstants';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);
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

function validateCustomerRarePlan(data: unknown) {
	return (
		isPlainObject(data) &&
		hasExactKeys(data, [
			'createdAt',
			'excludes',
			'id',
			'includes',
			'manualCustomers',
			'mealSource',
			'mode',
			'name',
			'places',
			'updatedAt',
		]) &&
		isIntegerInRange(data['createdAt'], 0, Number.MAX_SAFE_INTEGER - 1) &&
		isAllowedStringArray(data['excludes'], customerRareNames) &&
		typeof data['id'] === 'string' &&
		data['id'].length > 0 &&
		data['id'].length <= 128 &&
		isAllowedStringArray(data['includes'], customerRareNames) &&
		isAllowedStringArray(data['manualCustomers'], customerRareNames) &&
		(data['mealSource'] === 'recommended' ||
			data['mealSource'] === 'saved') &&
		(data['mode'] === 'manual' || data['mode'] === 'region') &&
		typeof data['name'] === 'string' &&
		data['name'].trim().length > 0 &&
		data['name'].length <= CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH &&
		isAllowedStringArray(data['places'], ALL_PLACES_SET) &&
		isIntegerInRange(data['updatedAt'], 0, Number.MAX_SAFE_INTEGER - 1)
	);
}

function validateCustomerRarePlans(data: unknown) {
	if (
		!isPlainObject(data) ||
		!hasExactKeys(data, ['activeId', 'items']) ||
		(data['activeId'] !== null && typeof data['activeId'] !== 'string') ||
		!Array.isArray(data['items']) ||
		!data['items'].every(validateCustomerRarePlan)
	) {
		return false;
	}

	const planIds = new Set(
		data['items'].map((plan) => (plan as Record<string, unknown>)['id'])
	);

	return data['activeId'] === null || planIds.has(data['activeId']);
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

export function validateSyncStateData(change: ISyncStateChange) {
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
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRarePlans) {
		return validateCustomerRarePlans(change.data);
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
