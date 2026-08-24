import isNil from 'lodash/isNil.js';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { checkPopularFoodTagId } from '@/domain/trends/checkPopularFoodTagId';
import type { TPopularFoodTagId } from '@/domain/trends/types';

import { type TRecommendationBridgeValidationResult } from '@/features/recommendations/client/bridge/shared';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

export const V1_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/u;

export interface IV1BridgeReadyMessage {
	readonly heartbeat_interval_ms: number;
	readonly instance_id: string;
	readonly max_in_flight: number;
	readonly protocol_version: 1;
	readonly type: 'bridge.ready';
}

export interface IV1BridgePingMessage {
	readonly timestamp: number;
	readonly type: 'bridge.ping';
}

export interface IV1BridgeReplacedMessage {
	readonly instance_id: string;
	readonly type: 'bridge.replaced';
}

export interface IV1RecommendationOrder {
	readonly beverage_tag_id: TBeverageTagId | null;
	readonly food_tag_id: TFoodTagId | null;
}

export interface IV1RecommendationSelection {
	readonly beverage_id?: TBeverageId;
	readonly food?: {
		readonly extra_ingredient_ids?: ReadonlyArray<TIngredientId>;
		readonly recipe_id: TRecipeId;
	};
}

export interface IV1RecommendationAvailabilityCategory<TId extends number> {
	readonly exclude?: ReadonlyArray<TId>;
	readonly include?: ReadonlyArray<TId>;
}

export interface IV1RecommendationAvailability {
	readonly beverages?: IV1RecommendationAvailabilityCategory<TBeverageId>;
	readonly foods?: IV1RecommendationAvailabilityCategory<TFoodId>;
	readonly ingredients?: IV1RecommendationAvailabilityCategory<TIngredientId>;
}

export const V1_RECOMMENDATION_STRATEGIES = [
	'availability_first',
	'low_price',
	'high_price',
	'material_cost_first',
] as const;

export type TV1RecommendationStrategy =
	(typeof V1_RECOMMENDATION_STRATEGIES)[number];

export interface IV1RecommendationOptions {
	readonly availability?: IV1RecommendationAvailability;
	readonly cooker_id?: TCookerId | null;
	readonly famous_shop?: boolean;
	readonly max_extra_ingredients?: number | null;
	readonly max_rating?: number;
	readonly max_results?: number;
	readonly mystia_cooker?: boolean;
	readonly popular_trend?: {
		readonly food_tag_id: TPopularFoodTagId;
		readonly negative: boolean;
	} | null;
	readonly recommendation_strategy?: TV1RecommendationStrategy;
}

export interface IV1RecommendationRequestPayload {
	readonly options?: IV1RecommendationOptions;
	readonly order?: IV1RecommendationOrder;
	readonly selection?: IV1RecommendationSelection;
	readonly special_guest_id: TSpecialGuestId;
}

export interface IV1RecommendationRequestMessage {
	readonly payload: IV1RecommendationRequestPayload;
	readonly request_id: string;
	readonly type: 'recommendation.request';
}

export interface IV1RecommendationCancelMessage {
	readonly request_id: string;
	readonly type: 'recommendation.cancel';
}

export type TV1RecommendationBridgeInboundMessage =
	| IV1BridgePingMessage
	| IV1BridgeReadyMessage
	| IV1BridgeReplacedMessage
	| IV1RecommendationCancelMessage
	| IV1RecommendationRequestMessage;

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const beverageMap = new Map(
	beverageCatalog.data.map((item) => [item.id, item] as const)
);
const cookerMap = new Map(
	cookerCatalog.data.map((item) => [item.id, item] as const)
);
const foodMap = new Map(
	foodCatalog.data.map((item) => [item.id, item] as const)
);
const ingredientMap = new Map(
	ingredientCatalog.data.map((item) => [item.id, item] as const)
);
const specialGuestMap = new Map(
	specialGuestCatalog.data.map((item) => [item.id, item] as const)
);
const beverageTags = new Set<TBeverageTagId>(
	beverageCatalog.getValuesByProp('tags')
);
const {
	blockedIngredients,
	blockedLevels: blockedIngredientLevels,
	blockedTags: blockedIngredientTags,
} = ingredientCatalog;
const { blockedFoods, blockedTags: blockedFoodTags } = foodCatalog;
const foodTags = new Set<TFoodTagId>(
	[
		...foodCatalog.getValuesByProp(['negativeTags', 'positiveTags']),
		...ingredientCatalog.getValuesByProp('tags'),
		...Object.values(DYNAMIC_FOOD_TAG_MAP),
	].filter((tag) => !blockedFoodTags.has(tag))
);
const popularTags: ReadonlySet<number> = new Set(
	[
		...ingredientCatalog
			.getValuesByProp('tags')
			.filter((tag) => !blockedIngredientTags.has(tag)),
		...foodCatalog
			.getValuesByProp('positiveTags')
			.filter((tag) => !blockedFoodTags.has(tag)),
	].filter(checkPopularFoodTagId)
);
const v1RecommendationStrategySet: ReadonlySet<unknown> = new Set(
	V1_RECOMMENDATION_STRATEGIES
);

function checkExactKeys(
	value: Record<string, unknown>,
	requiredKeys: ReadonlyArray<string>,
	optionalKeys: ReadonlyArray<string> = []
) {
	const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
	return (
		requiredKeys.every((key) => Object.hasOwn(value, key)) &&
		Object.keys(value).every((key) => allowedKeys.has(key))
	);
}

function checkSafeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value);
}

function checkSafeNonNegativeInteger(value: unknown) {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

function checkIntegerInRange(value: unknown, minimum: number, maximum: number) {
	return (
		Number.isInteger(value) &&
		(value as number) >= minimum &&
		(value as number) <= maximum
	);
}

function checkIdValues(value: unknown, shouldRequireUniqueValues: boolean) {
	return (
		Array.isArray(value) &&
		value.every(checkSafeInteger) &&
		(!shouldRequireUniqueValues || new Set(value).size === value.length)
	);
}

function invalid(reason: string, path?: string) {
	return {
		error: { ...(path === undefined ? {} : { path }), reason },
		ok: false,
	} as const;
}

function checkDlcAllowed(itemDlc: number, guestDlc: number) {
	return itemDlc === 0 || itemDlc === guestDlc;
}

function checkIngredientAllowed(id: number, guestDlc: number) {
	const ingredient = ingredientMap.get(id as TIngredientId);
	return (
		ingredient !== undefined &&
		checkDlcAllowed(ingredient.dlc, guestDlc) &&
		!blockedIngredients.has(ingredient.id) &&
		!blockedIngredientLevels.has(ingredient.level) &&
		!ingredient.tags.some((tag) => blockedIngredientTags.has(tag))
	);
}

function checkFoodBaseAllowed(
	food: (typeof foodCatalog.data)[number],
	guestDlc: number
) {
	return checkDlcAllowed(food.dlc, guestDlc) && !blockedFoods.has(food.id);
}

function checkRecipeAllowed(
	food: (typeof foodCatalog.data)[number],
	ingredients: ReadonlyArray<TIngredientId>,
	guestDlc: number
) {
	return (
		checkFoodBaseAllowed(food, guestDlc) &&
		ingredients.every((id) => checkIngredientAllowed(id, guestDlc))
	);
}

function checkFoodAllowed(id: number, guestDlc: number) {
	const food = foodMap.get(id as TFoodId);
	return (
		food?.recipes.some(({ ingredients }) =>
			checkRecipeAllowed(food, ingredients, guestDlc)
		) ?? false
	);
}

function validateIdArray<TId extends number>(
	value: unknown,
	path: string,
	checkValue: (id: number) => boolean,
	shouldRequireUniqueValues = true
): TRecommendationBridgeValidationResult<ReadonlyArray<TId>> {
	if (!checkIdValues(value, shouldRequireUniqueValues)) {
		return invalid('invalid-value', path);
	}
	if (!(value as number[]).every(checkValue)) {
		return invalid('unknown-or-unavailable-id', path);
	}
	return { ok: true, value: value as TId[] };
}

function checkAvailabilityIncludesRecord(availability: unknown, id: number) {
	if (availability === undefined) {
		return true;
	}
	if (!checkIsRecord(availability)) {
		return false;
	}
	const { exclude, include } = availability;
	return (
		(include === undefined ||
			(Array.isArray(include) && include.includes(id))) &&
		!(Array.isArray(exclude) && exclude.includes(id))
	);
}

function validateRequest(
	value: Record<string, unknown>
): TRecommendationBridgeValidationResult<IV1RecommendationRequestMessage> {
	if (
		!checkExactKeys(value, ['type', 'request_id', 'payload']) ||
		typeof value['request_id'] !== 'string' ||
		!V1_REQUEST_ID_PATTERN.test(value['request_id']) ||
		!checkIsRecord(value['payload'])
	) {
		return invalid('invalid-envelope');
	}
	const { payload } = value;
	if (
		!checkExactKeys(
			payload,
			['special_guest_id'],
			['order', 'selection', 'options']
		) ||
		!checkSafeInteger(payload['special_guest_id'])
	) {
		return invalid('invalid-value', 'payload');
	}
	const { options, order, selection } = payload;
	const specialGuest = specialGuestMap.get(
		payload['special_guest_id'] as TSpecialGuestId
	);
	if (specialGuest === undefined) {
		return invalid('unknown-or-unavailable-id', 'payload.special_guest_id');
	}

	if (
		order !== undefined &&
		(!checkIsRecord(order) ||
			!checkExactKeys(order, ['beverage_tag_id', 'food_tag_id']) ||
			(order['food_tag_id'] !== null &&
				(!checkSafeInteger(order['food_tag_id']) ||
					!foodTags.has(order['food_tag_id'] as TFoodTagId))) ||
			(order['beverage_tag_id'] !== null &&
				(!checkSafeInteger(order['beverage_tag_id']) ||
					!beverageTags.has(
						order['beverage_tag_id'] as TBeverageTagId
					))))
	) {
		return invalid('invalid-value', 'payload.order');
	}

	if (
		selection !== undefined &&
		(!checkIsRecord(selection) ||
			!checkExactKeys(selection, [], ['beverage_id', 'food']))
	) {
		return invalid('invalid-value', 'payload.selection');
	}
	const selectionObject = selection;
	const selectedBeverageValue = selectionObject?.['beverage_id'];
	const selectedBeverage = checkSafeInteger(selectedBeverageValue)
		? beverageMap.get(selectedBeverageValue as TBeverageId)
		: undefined;
	if (
		selectedBeverageValue !== undefined &&
		(selectedBeverage === undefined ||
			!checkDlcAllowed(selectedBeverage.dlc, specialGuest.dlc))
	) {
		return invalid(
			'unknown-or-unavailable-id',
			'payload.selection.beverage_id'
		);
	}
	const selectedFoodValue = selectionObject?.['food'];
	if (
		selectedFoodValue !== undefined &&
		(!checkIsRecord(selectedFoodValue) ||
			!checkExactKeys(
				selectedFoodValue,
				['recipe_id'],
				['extra_ingredient_ids']
			) ||
			!checkSafeInteger(selectedFoodValue['recipe_id']))
	) {
		return invalid('invalid-value', 'payload.selection.food');
	}
	const selectedOwner =
		selectedFoodValue === undefined
			? undefined
			: foodCatalog.findRecipeOwnerById(
					selectedFoodValue['recipe_id'] as TRecipeId
				);
	if (
		selectedFoodValue !== undefined &&
		(selectedOwner === undefined ||
			!checkRecipeAllowed(
				selectedOwner.food,
				selectedOwner.recipe.ingredients,
				specialGuest.dlc
			))
	) {
		return invalid(
			'unknown-or-unavailable-id',
			'payload.selection.food.recipe_id'
		);
	}
	const extraIngredients = selectedFoodValue?.['extra_ingredient_ids'] ?? [];
	const extraResult = validateIdArray<TIngredientId>(
		extraIngredients,
		'payload.selection.food.extra_ingredient_ids',
		(id) => checkIngredientAllowed(id, specialGuest.dlc),
		false
	);
	if (!extraResult.ok) {
		return extraResult;
	}
	if (
		selectedOwner !== undefined &&
		selectedOwner.recipe.ingredients.length + extraResult.value.length > 5
	) {
		return invalid(
			'too-many-ingredients',
			'payload.selection.food.extra_ingredient_ids'
		);
	}

	if (
		options !== undefined &&
		(!checkIsRecord(options) ||
			!checkExactKeys(
				options,
				[],
				[
					'availability',
					'cooker_id',
					'famous_shop',
					'max_extra_ingredients',
					'max_rating',
					'max_results',
					'mystia_cooker',
					'popular_trend',
					'recommendation_strategy',
				]
			))
	) {
		return invalid('invalid-value', 'payload.options');
	}
	const optionsObject = options;
	const cookerValue = optionsObject?.['cooker_id'];
	const cooker = checkSafeInteger(cookerValue)
		? cookerMap.get(cookerValue as TCookerId)
		: undefined;
	if (
		cookerValue !== undefined &&
		cookerValue !== null &&
		(cooker === undefined || !checkDlcAllowed(cooker.dlc, specialGuest.dlc))
	) {
		return invalid(
			'unknown-or-unavailable-id',
			'payload.options.cooker_id'
		);
	}
	if (
		selectedOwner !== undefined &&
		cookerValue !== undefined &&
		cookerValue !== null
	) {
		return invalid('incompatible-selection', 'payload.options.cooker_id');
	}
	for (const key of ['famous_shop', 'mystia_cooker'] as const) {
		const item = optionsObject?.[key];
		if (item !== undefined && typeof item !== 'boolean') {
			return invalid('invalid-value', `payload.options.${key}`);
		}
	}
	const recommendationStrategy = optionsObject?.['recommendation_strategy'];
	if (
		recommendationStrategy !== undefined &&
		!v1RecommendationStrategySet.has(recommendationStrategy)
	) {
		return invalid(
			'invalid-value',
			'payload.options.recommendation_strategy'
		);
	}
	const maxExtraIngredients = optionsObject?.['max_extra_ingredients'];
	if (
		maxExtraIngredients !== undefined &&
		maxExtraIngredients !== null &&
		!checkIntegerInRange(maxExtraIngredients, 0, 4)
	) {
		return invalid('out-of-range', 'payload.options.max_extra_ingredients');
	}
	if (
		typeof maxExtraIngredients === 'number' &&
		extraResult.value.length > maxExtraIngredients
	) {
		return invalid('out-of-range', 'payload.options.max_extra_ingredients');
	}
	for (const [key, minimum, maximum] of [
		['max_rating', 0, 4],
		['max_results', 1, 10],
	] as const) {
		const item = optionsObject?.[key];
		if (
			item !== undefined &&
			!checkIntegerInRange(item, minimum, maximum)
		) {
			return invalid('out-of-range', `payload.options.${key}`);
		}
	}
	const popularTrend = optionsObject?.['popular_trend'];
	if (
		popularTrend !== undefined &&
		popularTrend !== null &&
		(!checkIsRecord(popularTrend) ||
			!checkExactKeys(popularTrend, ['food_tag_id', 'negative']) ||
			!checkSafeInteger(popularTrend['food_tag_id']) ||
			!popularTags.has(popularTrend['food_tag_id']) ||
			typeof popularTrend['negative'] !== 'boolean')
	) {
		return invalid('invalid-value', 'payload.options.popular_trend');
	}
	const availability = optionsObject?.['availability'];
	if (
		availability !== undefined &&
		(!checkIsRecord(availability) ||
			!checkExactKeys(
				availability,
				[],
				['beverages', 'foods', 'ingredients']
			))
	) {
		return invalid('invalid-value', 'payload.options.availability');
	}
	const availabilityObject = availability;
	const availabilityChecks = [
		[
			'beverages',
			(id: number) => {
				const item = beverageMap.get(id as TBeverageId);
				return (
					item !== undefined &&
					checkDlcAllowed(item.dlc, specialGuest.dlc)
				);
			},
		],
		['foods', (id: number) => checkFoodAllowed(id, specialGuest.dlc)],
		[
			'ingredients',
			(id: number) => checkIngredientAllowed(id, specialGuest.dlc),
		],
	] as const;
	for (const [categoryKey, checker] of availabilityChecks) {
		const category = availabilityObject?.[categoryKey];
		if (
			category !== undefined &&
			(!checkIsRecord(category) ||
				!checkExactKeys(category, [], ['exclude', 'include']))
		) {
			return invalid(
				'invalid-value',
				`payload.options.availability.${categoryKey}`
			);
		}
		for (const listKey of ['exclude', 'include'] as const) {
			const result = validateIdArray(
				category?.[listKey] ?? [],
				`payload.options.availability.${categoryKey}.${listKey}`,
				checker
			);
			if (!result.ok) {
				return result;
			}
		}
	}
	if (
		(selectedOwner !== undefined &&
			!checkAvailabilityIncludesRecord(
				availabilityObject?.['foods'],
				selectedOwner.food.id
			)) ||
		(selectedBeverage !== undefined &&
			!checkAvailabilityIncludesRecord(
				availabilityObject?.['beverages'],
				selectedBeverage.id
			)) ||
		extraResult.value.some(
			(id) =>
				!checkAvailabilityIncludesRecord(
					availabilityObject?.['ingredients'],
					id
				)
		)
	) {
		return invalid(
			'incompatible-selection',
			'payload.options.availability'
		);
	}

	const hasMystiaCooker = optionsObject?.['mystia_cooker'] ?? false;
	const beverageTag = order?.['beverage_tag_id'] ?? null;
	const foodTag = order?.['food_tag_id'] ?? null;
	const hasSelection =
		selectedOwner !== undefined || selectedBeverage !== undefined;
	if (
		(!hasSelection &&
			(foodTag === null ||
				beverageTag === null ||
				hasMystiaCooker === true)) ||
		(hasSelection &&
			hasMystiaCooker === false &&
			(foodTag === null || beverageTag === null)) ||
		(foodTag !== null &&
			(foodTag === DYNAMIC_FOOD_TAG_MAP.popularPositive ||
				foodTag === DYNAMIC_FOOD_TAG_MAP.popularNegative) &&
			isNil(popularTrend))
	) {
		return invalid('invalid-mode', 'payload.order');
	}

	return {
		ok: true,
		value: value as unknown as IV1RecommendationRequestMessage,
	};
}

export function parseV1RecommendationBridgeMessage(
	value: unknown
): TRecommendationBridgeValidationResult<TV1RecommendationBridgeInboundMessage> {
	if (!checkIsRecord(value) || typeof value['type'] !== 'string') {
		return invalid('invalid-envelope');
	}

	switch (value['type']) {
		case 'bridge.ping':
			return checkExactKeys(value, ['type', 'timestamp']) &&
				checkSafeNonNegativeInteger(value['timestamp'])
				? { ok: true, value: value as unknown as IV1BridgePingMessage }
				: invalid('invalid-message');
		case 'bridge.ready':
			return checkExactKeys(value, [
				'type',
				'protocol_version',
				'instance_id',
				'max_in_flight',
				'heartbeat_interval_ms',
			]) &&
				value['protocol_version'] === 1 &&
				typeof value['instance_id'] === 'string' &&
				checkIntegerInRange(value['max_in_flight'], 1, 4) &&
				checkIntegerInRange(
					value['heartbeat_interval_ms'],
					10_000,
					120_000
				)
				? { ok: true, value: value as unknown as IV1BridgeReadyMessage }
				: invalid('invalid-message');
		case 'bridge.replaced':
			return checkExactKeys(value, ['type', 'instance_id']) &&
				typeof value['instance_id'] === 'string'
				? {
						ok: true,
						value: value as unknown as IV1BridgeReplacedMessage,
					}
				: invalid('invalid-message');
		case 'recommendation.cancel':
			return checkExactKeys(value, ['type', 'request_id']) &&
				typeof value['request_id'] === 'string' &&
				V1_REQUEST_ID_PATTERN.test(value['request_id'])
				? {
						ok: true,
						value: value as unknown as IV1RecommendationCancelMessage,
					}
				: invalid('invalid-envelope');
		case 'recommendation.request':
			return validateRequest(value);
		default:
			return invalid('unsupported-message');
	}
}
