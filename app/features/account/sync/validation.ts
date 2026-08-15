import { THEME_MAP } from '@/design/theme/runtime/constants';

import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { SYNC_SCHEMA_VERSION_MAP } from './constants';
import { parseClientSyncGeneration } from './protocol';
import {
	validateLegacyNormalGuestSavedMealV1,
	validateLegacyNormalGuestSavedMealV2,
	validateLegacySpecialGuestSavedMealV1,
	validateLegacySpecialGuestSavedMealV2,
} from './serializers/legacySavedMeals';
import {
	validateLegacyMealSnapshot,
	validateMealSnapshot,
	validateNormalGuestSavedMeal,
	validateSpecialGuestSavedMeal,
} from './serializers/meals';
import { validateSpecialGuestPlansData as checkSpecialGuestPlansData } from './serializers/specialGuestPlansMerge';
import { checkLegacyPopularTag, checkPopularTag } from './serializers/tags';
import {
	hasExactKeys,
	isAllowedStringArray,
	isIntegerInRange,
	isStringArray,
} from './serializers/utils';
import type { ISyncStateChange, ISyncStatePutBody } from './types';

export { validateSpecialGuestPlansData } from './serializers/specialGuestPlansMerge';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);
const beverageNames = new Set<string>(BeverageCatalog.getInstance().getNames());
const beverages = new Set<number>(
	BeverageCatalog.getInstance().getValuesByProp('id')
);
const ingredientNames = new Set<string>(
	IngredientCatalog.getInstance().getNames()
);
const ingredients = new Set<number>(
	IngredientCatalog.getInstance().getValuesByProp('id')
);
const foodCatalog = FoodCatalog.getInstance();
const foodNames = new Set<string>(foodCatalog.getNames());
const foods = new Set<number>(foodCatalog.getValuesByProp('id'));
const dlcKeys = new Set<string>(Object.keys(DLC_LABEL_MAP));
const beverageColumnKeys = new Set([
	'beverage',
	'price',
	'suitability',
	'action',
]);
const legacyRecipeColumnKeys = new Set([
	'recipe',
	'cooker',
	'ingredient',
	'price',
	'suitability',
	'action',
	'time',
]);
const foodColumnKeys = new Set([
	'food',
	'cookerType',
	'ingredient',
	'price',
	'suitability',
	'action',
	'time',
]);
const themeValues = new Set<string>(Object.values(THEME_MAP));
export function validateNormalGuestMealsData(
	data: unknown,
	schemaVersion: number = SYNC_SCHEMA_VERSION_MAP[
		SYNC_NAMESPACE_MAP.normalGuestMeals
	]
) {
	if (schemaVersion === 1 || schemaVersion === 2) {
		return validateLegacyMealSnapshot(data, {
			guestType: 'normal',
			validateMeal:
				schemaVersion === 1
					? validateLegacyNormalGuestSavedMealV1
					: validateLegacyNormalGuestSavedMealV2,
		});
	}

	return (
		schemaVersion === 3 &&
		validateMealSnapshot(data, {
			guestType: 'normal',
			validateMeal: validateNormalGuestSavedMeal,
		})
	);
}

export function validateSpecialGuestMealsData(
	data: unknown,
	schemaVersion: number = SYNC_SCHEMA_VERSION_MAP[
		SYNC_NAMESPACE_MAP.specialGuestMeals
	]
) {
	if (schemaVersion === 1 || schemaVersion === 2) {
		return validateLegacyMealSnapshot(data, {
			guestType: 'special',
			validateMeal:
				schemaVersion === 1
					? validateLegacySpecialGuestSavedMealV1
					: validateLegacySpecialGuestSavedMealV2,
		});
	}

	return (
		schemaVersion === 3 &&
		validateMealSnapshot(data, {
			guestType: 'special',
			validateMeal: validateSpecialGuestSavedMeal,
		})
	);
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

function validateGlobalPreferences(data: unknown, schemaVersion: number) {
	if (
		!isObjectTagRecord(data) ||
		(schemaVersion !== 1 && schemaVersion !== 2)
	) {
		return false;
	}
	const tagsTooltipKey =
		schemaVersion === 2
			? 'guestCardTagsTooltip'
			: 'customerCardTagsTooltip';

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
			'donationModal',
			'famousShop',
			tagsTooltipKey,
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
		hasExactKeys(
			tableHiddenItems,
			schemaVersion === 1
				? ['beverages', 'ingredients', 'recipes']
				: ['beverages', 'foods', 'ingredients']
		) &&
		typeof data[tagsTooltipKey] === 'boolean' &&
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
			(schemaVersion === 1
				? checkLegacyPopularTag(popularTrend['tag'])
				: checkPopularTag(popularTrend['tag']))) &&
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
		tableColumns['recipe'].every((item) =>
			(schemaVersion === 2 ? foodColumnKeys : legacyRecipeColumnKeys).has(
				item
			)
		) &&
		(schemaVersion === 1
			? isAllowedStringArray(
					tableHiddenItems['beverages'],
					beverageNames
				) &&
				isAllowedStringArray(
					tableHiddenItems['ingredients'],
					ingredientNames
				) &&
				isAllowedStringArray(tableHiddenItems['recipes'], foodNames)
			: isAllowedNumberArray(tableHiddenItems['beverages'], beverages) &&
				isAllowedNumberArray(tableHiddenItems['foods'], foods) &&
				isAllowedNumberArray(
					tableHiddenItems['ingredients'],
					ingredients
				)) &&
		isIntegerInRange(table['row'], 5, 20) &&
		typeof data['tachie'] === 'boolean' &&
		typeof data['vibrate'] === 'boolean'
	);
}

export function validateSyncStateData(change: ISyncStateChange) {
	if (change.namespace === SYNC_NAMESPACE_MAP.globalPreferences) {
		return validateGlobalPreferences(change.data, change.schema_version);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.normalGuestMeals) {
		return validateNormalGuestMealsData(change.data, change.schema_version);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.specialGuestMeals) {
		return validateSpecialGuestMealsData(
			change.data,
			change.schema_version
		);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.specialGuestPlans) {
		return checkSpecialGuestPlansData(change.data, change.schema_version);
	}
	if (change.namespace === SYNC_NAMESPACE_MAP.specialGuestSettings) {
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
			!isNonNegativeSafeInteger(change['schema_version']) ||
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
