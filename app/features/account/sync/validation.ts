import { THEME_MAP } from '@/design/theme/runtime/constants';

import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { ALL_PLACES_SET } from '@/domain/data/places/placeFacts';

import { CUSTOMER_RARE_PLAN_MAX_NAME_LENGTH } from '@/features/customerPlans/constants';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	SYNC_SCHEMA_VERSION_MAP,
	checkSupportedSyncSchemaVersion,
} from './constants';
import { parseClientSyncGeneration } from './protocol';
import { validateMealRecipeV1 as checkMealRecipeV1 } from './serializers/meals';
import {
	checkBeverageTag,
	checkPopularTag,
	checkRecipeTag,
} from './serializers/tags';
import {
	hasExactKeys,
	isAllowedStringArray,
	isIntegerInRange,
	isStringArray,
} from './serializers/utils';
import type { ISyncStateChange, ISyncStatePutBody } from './types';

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
const recipeInstance = Recipe.getInstance();
const recipeNames = new Set<string>(recipeInstance.getNames());
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
const customerRarePlanSortValues = new Set([
	'default',
	'pinyin-asc',
	'pinyin-asc-flat',
	'pinyin-desc',
	'pinyin-desc-flat',
]);
const customerRarePlanKeys = [
	'createdAt',
	'customerSort',
	'excludes',
	'id',
	'includes',
	'manualCustomers',
	'mealSource',
	'mode',
	'name',
	'places',
	'updatedAt',
];
const legacyCustomerRarePlanKeys = customerRarePlanKeys.filter(
	(key) => key !== 'customerSort'
);

function validateMealRecipeV2(data: unknown) {
	return recipeInstance.isMealRecipe(data);
}

function validateCustomerNormalMeal(
	data: unknown,
	validateMealRecipe: (recipe: unknown) => boolean
) {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null ||
			(typeof data['beverage'] === 'string' &&
				beverageNames.has(data['beverage']))) &&
		validateMealRecipe(data['recipe'])
	);
}

function validateCustomerRareMeal(
	data: unknown,
	validateMealRecipe: (recipe: unknown) => boolean
) {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, [
			'beverage',
			'hasMystiaCooker',
			'order',
			'recipe',
		]) &&
		typeof data['beverage'] === 'string' &&
		beverageNames.has(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
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
		isObjectTagRecord(data) &&
		Object.entries(data).every(
			([customerName, meals]) =>
				customerNames.has(customerName) &&
				Array.isArray(meals) &&
				meals.every(validateMeal)
		)
	);
}

export function validateCustomerNormalMealsData(
	data: unknown,
	schemaVersion: number = SYNC_SCHEMA_VERSION_MAP[
		SYNC_NAMESPACE_MAP.customerNormalMeals
	]
) {
	if (schemaVersion !== 1 && schemaVersion !== 2) {
		return false;
	}
	const validateRecipe =
		schemaVersion === 1 ? checkMealRecipeV1 : validateMealRecipeV2;
	return validateMealSnapshot(data, {
		customerNames: customerNormalNames,
		validateMeal: (meal) =>
			validateCustomerNormalMeal(meal, validateRecipe),
	});
}

export function validateCustomerRareMealsData(
	data: unknown,
	schemaVersion: number = SYNC_SCHEMA_VERSION_MAP[
		SYNC_NAMESPACE_MAP.customerRareMeals
	]
) {
	if (schemaVersion !== 1 && schemaVersion !== 2) {
		return false;
	}
	const validateRecipe =
		schemaVersion === 1 ? checkMealRecipeV1 : validateMealRecipeV2;
	return validateMealSnapshot(data, {
		customerNames: customerRareNames,
		validateMeal: (meal) => validateCustomerRareMeal(meal, validateRecipe),
	});
}

function validateCustomerRarePlan(
	data: unknown,
	{ allowLegacyCustomerSort = false } = {}
) {
	if (!isObjectTagRecord(data)) {
		return false;
	}

	const hasCustomerSort = 'customerSort' in data;
	if (!hasCustomerSort && !allowLegacyCustomerSort) {
		return false;
	}

	return (
		(hasCustomerSort
			? hasExactKeys(data, customerRarePlanKeys)
			: hasExactKeys(data, legacyCustomerRarePlanKeys)) &&
		isIntegerInRange(data['createdAt'], 0, Number.MAX_SAFE_INTEGER - 1) &&
		(!hasCustomerSort ||
			(typeof data['customerSort'] === 'string' &&
				customerRarePlanSortValues.has(data['customerSort']))) &&
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

export function validateCustomerRarePlansData(
	data: unknown,
	{ allowLegacyCustomerSort = false } = {}
) {
	if (
		!isObjectTagRecord(data) ||
		!hasExactKeys(data, ['activeId', 'items']) ||
		(data['activeId'] !== null && typeof data['activeId'] !== 'string') ||
		!Array.isArray(data['items']) ||
		!data['items'].every((plan) =>
			validateCustomerRarePlan(plan, { allowLegacyCustomerSort })
		)
	) {
		return false;
	}

	const planIds = new Set(
		data['items'].map((plan) => (plan as Record<string, unknown>)['id'])
	);

	return data['activeId'] === null || planIds.has(data['activeId']);
}

function validateGlobalPreferences(data: unknown) {
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
		isObjectTagRecord(tableColumns) &&
		hasExactKeys(tableColumns, ['beverage', 'recipe']) &&
		isObjectTagRecord(tableHiddenItems) &&
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
		return validateCustomerNormalMealsData(
			change.data,
			change.schema_version
		);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRareMeals) {
		return validateCustomerRareMealsData(
			change.data,
			change.schema_version
		);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRarePlans) {
		return validateCustomerRarePlansData(change.data, {
			allowLegacyCustomerSort: change.schema_version === 1,
		});
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.customerRareSettings) {
		return (
			isObjectTagRecord(change.data) &&
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
		isObjectTagRecord(change.data) &&
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
	const syncGeneration = parseClientSyncGeneration(body);
	const rootKeys = [
		'changes',
		'state_epoch',
		'sync_generation',
		...allowedExtraRootKeys,
	];
	if (
		!isObjectTagRecord(body) ||
		!hasExactKeys(body, rootKeys) ||
		!('state_epoch' in body) ||
		!isNonNegativeSafeInteger(body['state_epoch']) ||
		syncGeneration === null ||
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
			!isObjectTagRecord(change) ||
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
			!checkSupportedSyncSchemaVersion(
				change['namespace'],
				change['schema_version']
			)
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
		changes.push(parsedChange);
	}

	return {
		changes,
		state_epoch: body['state_epoch'],
		sync_generation: syncGeneration,
	} satisfies ISyncStatePutBody;
}

export function checkSyncStateRebuildChanges(changes: ISyncStateChange[]) {
	return (
		changes.length === SYNC_NAMESPACE_SET.size &&
		changes.every((change) => change.revision === 0)
	);
}

export function findUnsupportedSyncSchemaVersion(body: unknown) {
	if (!isObjectTagRecord(body) || !Array.isArray(body['changes'])) {
		return null;
	}

	for (const change of body['changes']) {
		if (
			!isObjectTagRecord(change) ||
			!checkSyncNamespace(change['namespace']) ||
			!isNonNegativeSafeInteger(change['schema_version'])
		) {
			continue;
		}
		const currentSchemaVersion =
			SYNC_SCHEMA_VERSION_MAP[change['namespace']];
		if (change['schema_version'] > currentSchemaVersion) {
			return {
				current_schema_version: currentSchemaVersion,
				namespace: change['namespace'],
			};
		}
	}

	return null;
}
