import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import {
	BEVERAGE_TAG_MAP,
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type {
	TBeverageTagId,
	TBeverageTagLabel,
	TFoodTagId,
	TFoodTagLabel,
} from '@/domain/data/tags/types';
import { checkPopularFoodTagId } from '@/domain/trends/checkPopularFoodTagId';
import type { TPopularFoodTagId } from '@/domain/trends/types';

const beverageTagLabels = new Set<string>(Object.values(BEVERAGE_TAG_MAP));
const beverageTags = new Set<number>(Object.keys(BEVERAGE_TAG_MAP).map(Number));
const ingredientCatalog = IngredientCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const foodTags = new Set([
	...foodCatalog.getValuesByProp(['positiveTags', 'negativeTags']),
	...Object.values(DYNAMIC_FOOD_TAG_MAP),
]);
const numericFoodTags: ReadonlySet<number> = foodTags;
const foodTagLabels = new Set<string>(
	[...foodTags].map((tag) => FOOD_TAG_MAP[tag])
);
const popularTags = new Set(
	[
		...ingredientCatalog
			.getValuesByProp('tags')
			.filter((tag) => !ingredientCatalog.blockedTags.has(tag)),
		...foodCatalog
			.getValuesByProp('positiveTags')
			.filter((tag) => !foodCatalog.blockedTags.has(tag)),
	].filter(checkPopularFoodTagId)
);
const numericPopularTags: ReadonlySet<number> = popularTags;
const popularTagLabels = new Set<string>(
	[...popularTags].map((tag) => FOOD_TAG_MAP[tag])
);

export function checkBeverageTag(data: unknown): data is TBeverageTagId {
	return typeof data === 'number' && beverageTags.has(data);
}

export function checkFoodTag(data: unknown): data is TFoodTagId {
	return typeof data === 'number' && numericFoodTags.has(data);
}

export function checkLegacyBeverageTag(
	data: unknown
): data is TBeverageTagLabel {
	return typeof data === 'string' && beverageTagLabels.has(data);
}

export function checkLegacyFoodTag(data: unknown): data is TFoodTagLabel {
	return typeof data === 'string' && foodTagLabels.has(data);
}

export function checkPopularTag(data: unknown): data is TPopularFoodTagId {
	return typeof data === 'number' && numericPopularTags.has(data);
}

export function checkLegacyPopularTag(data: unknown): data is TFoodTagLabel {
	return typeof data === 'string' && popularTagLabels.has(data);
}

export function resolveLegacyBeverageTag(
	label: TBeverageTagLabel
): TBeverageTagId {
	return resolveLegacyTagLabel({
		errorCode: 'invalid-legacy-beverage-tag',
		facts: BEVERAGE_TAG_MAP,
		label,
	});
}

export function resolveLegacyFoodTag(label: TFoodTagLabel): TFoodTagId {
	return resolveLegacyTagLabel({
		errorCode: 'invalid-legacy-food-tag',
		facts: FOOD_TAG_MAP,
		label,
	});
}

export function resolveLegacyPopularTag(
	label: TFoodTagLabel
): TPopularFoodTagId {
	return resolveLegacyTagLabel<TPopularFoodTagId>({
		allowed: numericPopularTags,
		errorCode: 'invalid-legacy-popular-tag',
		facts: FOOD_TAG_MAP,
		label,
	});
}
