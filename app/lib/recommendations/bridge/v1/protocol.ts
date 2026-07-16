import {
	DYNAMIC_TAG_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCookerName,
	type TCustomerRareName,
	type TIngredientName,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { TPopularTag } from '@/types';
import { Beverage, Cooker, CustomerRare, Ingredient, Recipe } from '@/utils';

import { type TRecommendationBridgeValidationResult } from '../protocol';
import { checkOwnProperty } from '../shared';

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
	readonly beverage_tag: TBeverageTag | null;
	readonly recipe_tag: TRecipeTag | null;
}

export interface IV1RecommendationSelection {
	readonly beverage?: TBeverageName;
	readonly recipe?: {
		readonly extra_ingredients?: ReadonlyArray<TIngredientName>;
		readonly name: TRecipeName;
	};
}

export interface IV1RecommendationAvailabilityCategory<TName extends string> {
	readonly exclude?: ReadonlyArray<TName>;
	readonly include?: ReadonlyArray<TName>;
}

export interface IV1RecommendationAvailability {
	readonly beverages?: IV1RecommendationAvailabilityCategory<TBeverageName>;
	readonly ingredients?: IV1RecommendationAvailabilityCategory<TIngredientName>;
	readonly recipes?: IV1RecommendationAvailabilityCategory<TRecipeName>;
}

export interface IV1RecommendationOptions {
	readonly availability?: IV1RecommendationAvailability;
	readonly cooker?: TCookerName | null;
	readonly famous_shop?: boolean;
	readonly max_extra_ingredients?: number | null;
	readonly max_rating?: number;
	readonly max_results?: number;
	readonly mystia_cooker?: boolean;
	readonly popular_trend?: {
		readonly negative: boolean;
		readonly tag: TPopularTag;
	} | null;
}

export interface IV1RecommendationRequestMessage {
	readonly payload: {
		readonly customer: TCustomerRareName;
		readonly options?: IV1RecommendationOptions;
		readonly order?: IV1RecommendationOrder;
		readonly selection?: IV1RecommendationSelection;
	};
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

const beverageInstance = Beverage.getInstance();
const cookerInstance = Cooker.getInstance();
const customerInstance = CustomerRare.getInstance();
const ingredientInstance = Ingredient.getInstance();
const recipeInstance = Recipe.getInstance();
const customerMap = new Map(
	customerInstance.data.map((item) => [item.name, item])
);
const beverageMap = new Map(
	beverageInstance.data.map((item) => [item.name, item])
);
const recipeMap = new Map(recipeInstance.data.map((item) => [item.name, item]));
const ingredientMap = new Map(
	ingredientInstance.data.map((item) => [item.name, item])
);
const cookerMap = new Map(cookerInstance.data.map((item) => [item.name, item]));
const beverageTags = new Set(beverageInstance.getValuesByProp('tags'));
const blockedIngredientNames = ingredientInstance.blockedIngredients;
const blockedIngredientLevels = ingredientInstance.blockedLevels;
const blockedIngredientTags = ingredientInstance.blockedTags;
const blockedRecipeNames = recipeInstance.blockedRecipes;
const blockedRecipeTags = recipeInstance.blockedTags;
const recipeTags = new Set<string>(
	[
		...recipeInstance.getValuesByProp(['negativeTags', 'positiveTags']),
		...ingredientInstance.getValuesByProp('tags'),
		DYNAMIC_TAG_MAP.economical,
		DYNAMIC_TAG_MAP.expensive,
		DYNAMIC_TAG_MAP.largePartition,
		DYNAMIC_TAG_MAP.popularNegative,
		DYNAMIC_TAG_MAP.popularPositive,
		DYNAMIC_TAG_MAP.signature,
	].filter((tag) => !blockedRecipeTags.has(tag as TRecipeTag))
);
const popularTags = new Set<string>([
	...ingredientInstance
		.getValuesByProp('tags')
		.filter((tag) => !blockedIngredientTags.has(tag)),
	...recipeInstance
		.getValuesByProp('positiveTags')
		.filter((tag) => !blockedRecipeTags.has(tag)),
]);

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkExactKeys(
	value: Record<string, unknown>,
	requiredKeys: ReadonlyArray<string>,
	optionalKeys: ReadonlyArray<string> = []
) {
	const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
	return (
		requiredKeys.every((key) => checkOwnProperty(value, key)) &&
		Object.keys(value).every((key) => allowedKeys.has(key))
	);
}

function checkSafeNonNegativeInteger(value: unknown) {
	return Number.isSafeInteger(value) && (value as number) >= 0;
}

function checkIntegerInRange(value: unknown, minimum: number, maximum: number) {
	return (
		Number.isInteger(value) &&
		(value as number) >= minimum &&
		(value as number) <= maximum
	);
}

function checkUniqueStrings(value: unknown) {
	return (
		Array.isArray(value) &&
		value.every((item) => typeof item === 'string') &&
		new Set(value).size === value.length
	);
}

function invalid(reason: string, path?: string) {
	return {
		error: { ...(path === undefined ? {} : { path }), reason },
		ok: false,
	} as const;
}

function checkDlcAllowed(itemDlc: number, customerDlc: number) {
	return itemDlc === 0 || itemDlc === customerDlc;
}

function checkIngredientAllowed(name: string, customerDlc: number) {
	const ingredient = ingredientMap.get(name as TIngredientName);
	return (
		ingredient !== undefined &&
		checkDlcAllowed(ingredient.dlc, customerDlc) &&
		!blockedIngredientNames.has(ingredient.name) &&
		!blockedIngredientLevels.has(ingredient.level) &&
		!ingredient.tags.some((tag) => blockedIngredientTags.has(tag))
	);
}

function checkRecipeAllowed(name: string, customerDlc: number) {
	const recipe = recipeMap.get(name as TRecipeName);
	return (
		recipe !== undefined &&
		checkDlcAllowed(recipe.dlc, customerDlc) &&
		!blockedRecipeNames.has(recipe.name) &&
		recipe.ingredients.every((ingredientName) =>
			checkIngredientAllowed(ingredientName, customerDlc)
		)
	);
}

function validateStringArray(
	value: unknown,
	path: string,
	checkValue: (name: string) => boolean
): TRecommendationBridgeValidationResult<ReadonlyArray<string>> {
	if (!checkUniqueStrings(value)) {
		return invalid('invalid-value', path);
	}
	if (!(value as string[]).every(checkValue)) {
		return invalid('unknown-or-unavailable-name', path);
	}
	return { ok: true, value: value as string[] };
}

function checkAvailabilityIncludesName(availability: unknown, name: string) {
	if (availability === undefined) {
		return true;
	}
	if (!checkPlainObject(availability)) {
		return false;
	}
	const { exclude, include } = availability;
	return (
		(include === undefined ||
			(Array.isArray(include) && include.includes(name))) &&
		!(Array.isArray(exclude) && exclude.includes(name))
	);
}

function validateRequest(
	value: Record<string, unknown>
): TRecommendationBridgeValidationResult<IV1RecommendationRequestMessage> {
	if (
		!checkExactKeys(value, ['type', 'request_id', 'payload']) ||
		typeof value['request_id'] !== 'string' ||
		!V1_REQUEST_ID_PATTERN.test(value['request_id']) ||
		!checkPlainObject(value['payload'])
	) {
		return invalid('invalid-envelope');
	}
	const { payload } = value;
	if (
		!checkExactKeys(
			payload,
			['customer'],
			['order', 'selection', 'options']
		)
	) {
		return invalid('invalid-value', 'payload');
	}
	if (typeof payload['customer'] !== 'string') {
		return invalid('invalid-value', 'payload.customer');
	}
	const { customer: customerName, options, order, selection } = payload;
	const customer = customerMap.get(customerName as TCustomerRareName);
	if (customer === undefined) {
		return invalid('unknown-or-unavailable-name', 'payload.customer');
	}

	if (
		order !== undefined &&
		(!checkPlainObject(order) ||
			!checkExactKeys(order, ['recipe_tag', 'beverage_tag']) ||
			(order['recipe_tag'] !== null &&
				(typeof order['recipe_tag'] !== 'string' ||
					!recipeTags.has(order['recipe_tag']))) ||
			(order['beverage_tag'] !== null &&
				(typeof order['beverage_tag'] !== 'string' ||
					!beverageTags.has(order['beverage_tag'] as TBeverageTag))))
	) {
		return invalid('invalid-value', 'payload.order');
	}

	if (
		selection !== undefined &&
		(!checkPlainObject(selection) ||
			!checkExactKeys(selection, [], ['recipe', 'beverage']))
	) {
		return invalid('invalid-value', 'payload.selection');
	}
	const selectionObject = selection;
	const selectedBeverageName = selectionObject?.['beverage'];
	const selectedBeverage =
		typeof selectedBeverageName === 'string'
			? beverageMap.get(selectedBeverageName as TBeverageName)
			: undefined;
	if (
		selectedBeverageName !== undefined &&
		(selectedBeverage === undefined ||
			!checkDlcAllowed(selectedBeverage.dlc, customer.dlc))
	) {
		return invalid(
			'unknown-or-unavailable-name',
			'payload.selection.beverage'
		);
	}
	const selectedRecipeValue = selectionObject?.['recipe'];
	if (
		selectedRecipeValue !== undefined &&
		(!checkPlainObject(selectedRecipeValue) ||
			!checkExactKeys(
				selectedRecipeValue,
				['name'],
				['extra_ingredients']
			) ||
			typeof selectedRecipeValue['name'] !== 'string')
	) {
		return invalid('invalid-value', 'payload.selection.recipe');
	}
	const selectedRecipe =
		selectedRecipeValue === undefined
			? undefined
			: recipeMap.get(selectedRecipeValue['name'] as TRecipeName);
	if (
		selectedRecipeValue !== undefined &&
		(selectedRecipe === undefined ||
			!checkRecipeAllowed(selectedRecipe.name, customer.dlc))
	) {
		return invalid(
			'unknown-or-unavailable-name',
			'payload.selection.recipe.name'
		);
	}
	const extraIngredients = selectedRecipeValue?.['extra_ingredients'] ?? [];
	const extraResult = validateStringArray(
		extraIngredients,
		'payload.selection.recipe.extra_ingredients',
		(name) => checkIngredientAllowed(name, customer.dlc)
	);
	if (!extraResult.ok) {
		return extraResult;
	}
	if (
		selectedRecipe !== undefined &&
		(extraIngredients as string[]).some((name) =>
			new Set<string>(selectedRecipe.ingredients).has(name)
		)
	) {
		return invalid(
			'contains-base-ingredient',
			'payload.selection.recipe.extra_ingredients'
		);
	}
	if (
		selectedRecipe !== undefined &&
		selectedRecipe.ingredients.length +
			(extraIngredients as string[]).length >
			5
	) {
		return invalid(
			'too-many-ingredients',
			'payload.selection.recipe.extra_ingredients'
		);
	}

	if (
		options !== undefined &&
		(!checkPlainObject(options) ||
			!checkExactKeys(
				options,
				[],
				[
					'cooker',
					'mystia_cooker',
					'famous_shop',
					'popular_trend',
					'max_extra_ingredients',
					'max_rating',
					'max_results',
					'availability',
				]
			))
	) {
		return invalid('invalid-value', 'payload.options');
	}
	const optionsObject = options;
	const cooker = optionsObject?.['cooker'];
	if (
		cooker !== undefined &&
		cooker !== null &&
		(typeof cooker !== 'string' ||
			!checkDlcAllowed(
				cookerMap.get(cooker as TCookerName)?.dlc ?? Number.NaN,
				customer.dlc
			))
	) {
		return invalid('unknown-or-unavailable-name', 'payload.options.cooker');
	}
	if (
		selectedRecipe !== undefined &&
		cooker !== undefined &&
		cooker !== null
	) {
		return invalid('incompatible-selection', 'payload.options.cooker');
	}
	for (const key of ['mystia_cooker', 'famous_shop'] as const) {
		const item = optionsObject?.[key];
		if (item !== undefined && typeof item !== 'boolean') {
			return invalid('invalid-value', `payload.options.${key}`);
		}
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
		(extraIngredients as string[]).length > maxExtraIngredients
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
		(!checkPlainObject(popularTrend) ||
			!checkExactKeys(popularTrend, ['tag', 'negative']) ||
			typeof popularTrend['tag'] !== 'string' ||
			!popularTags.has(popularTrend['tag']) ||
			typeof popularTrend['negative'] !== 'boolean')
	) {
		return invalid('invalid-value', 'payload.options.popular_trend');
	}
	const availability = optionsObject?.['availability'];
	if (
		availability !== undefined &&
		(!checkPlainObject(availability) ||
			!checkExactKeys(
				availability,
				[],
				['recipes', 'beverages', 'ingredients']
			))
	) {
		return invalid('invalid-value', 'payload.options.availability');
	}
	const availabilityObject = availability;
	const availabilityChecks = [
		['recipes', (name: string) => checkRecipeAllowed(name, customer.dlc)],
		[
			'beverages',
			(name: string) => {
				const item = beverageMap.get(name as TBeverageName);
				return (
					item !== undefined &&
					checkDlcAllowed(item.dlc, customer.dlc)
				);
			},
		],
		[
			'ingredients',
			(name: string) => checkIngredientAllowed(name, customer.dlc),
		],
	] as const;
	for (const [categoryKey, checker] of availabilityChecks) {
		const category = availabilityObject?.[categoryKey];
		if (
			category !== undefined &&
			(!checkPlainObject(category) ||
				!checkExactKeys(category, [], ['include', 'exclude']))
		) {
			return invalid(
				'invalid-value',
				`payload.options.availability.${categoryKey}`
			);
		}
		for (const listKey of ['include', 'exclude'] as const) {
			const result = validateStringArray(
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
		(selectedRecipe !== undefined &&
			!checkAvailabilityIncludesName(
				availabilityObject?.['recipes'],
				selectedRecipe.name
			)) ||
		(selectedBeverage !== undefined &&
			!checkAvailabilityIncludesName(
				availabilityObject?.['beverages'],
				selectedBeverage.name
			)) ||
		(extraIngredients as string[]).some(
			(name) =>
				!checkAvailabilityIncludesName(
					availabilityObject?.['ingredients'],
					name
				)
		)
	) {
		return invalid(
			'incompatible-selection',
			'payload.options.availability'
		);
	}

	const hasMystiaCooker = optionsObject?.['mystia_cooker'] ?? false;
	const recipeTag = order?.['recipe_tag'] ?? null;
	const beverageTag = order?.['beverage_tag'] ?? null;
	const hasSelection =
		selectedRecipe !== undefined || selectedBeverage !== undefined;
	if (
		(!hasSelection &&
			(recipeTag === null ||
				beverageTag === null ||
				hasMystiaCooker === true)) ||
		(hasSelection &&
			hasMystiaCooker === false &&
			(recipeTag === null || beverageTag === null)) ||
		(recipeTag !== null &&
			(recipeTag === DYNAMIC_TAG_MAP.popularPositive ||
				recipeTag === DYNAMIC_TAG_MAP.popularNegative) &&
			(popularTrend === undefined || popularTrend === null))
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
	if (!checkPlainObject(value) || typeof value['type'] !== 'string') {
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
