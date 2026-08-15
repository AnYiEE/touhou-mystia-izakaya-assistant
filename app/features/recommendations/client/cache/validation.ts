import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood } from '@/domain/meals/types';
import type { ISuggestedMeal } from '@/domain/recommendations/types';

import {
	isNonNegativeSafeInteger,
	isNullableNonNegativeSafeInteger,
} from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

export interface ICachedSpecialGuestPlanRecommendationMeal {
	cooker: TCookerId;
	dataIndex: number | null;
	evaluation: {
		isDarkMatter: boolean;
		price: number;
		rating: TRatingKey | null;
	};
	meal: {
		beverage: TBeverageId;
		food: IMealFood;
		hasMystiaCooker: boolean;
		order: {
			beverageTag: TBeverageTagId | null;
			foodTag: TFoodTagId | null;
		};
	};
	recommendedSetIndex: number | null;
	source: 'recommended';
	visibleIndex: number;
}

type TSpecialGuestPlanRecommendationCacheResult =
	ICachedSpecialGuestPlanRecommendationMeal[];

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();

const beverages = new Set<number>(beverageCatalog.getValuesByProp('id'));
const cookers = new Set<number>(cookerCatalog.getValuesByProp('id'));
const ratingKeys = new Set<string>(['bad', 'exbad', 'exgood', 'good', 'norm']);

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function isBeverage(value: unknown): value is TBeverageId {
	return typeof value === 'number' && beverages.has(value);
}

function isCooker(value: unknown): value is TCookerId {
	return typeof value === 'number' && cookers.has(value);
}

function isBeverageTagOrNull(value: unknown): value is TBeverageTagId | null {
	return (
		value === null ||
		(typeof value === 'number' && Object.hasOwn(BEVERAGE_TAG_MAP, value))
	);
}

function isFoodTagOrNull(value: unknown): value is TFoodTagId | null {
	return (
		value === null ||
		(typeof value === 'number' && Object.hasOwn(FOOD_TAG_MAP, value))
	);
}

function isRatingKey(value: unknown): value is TRatingKey {
	return typeof value === 'string' && ratingKeys.has(value);
}

function validateMealFood(value: unknown): IMealFood | undefined {
	if (!foodCatalog.isMealFood(value)) {
		return undefined;
	}

	return {
		extraIngredients: [...value.extraIngredients],
		recipeId: value.recipeId,
	};
}

function validateSuggestedMeal(value: unknown): ISuggestedMeal | undefined {
	if (
		!checkIsRecord(value) ||
		!isBeverage(value['beverage']) ||
		!isFiniteNumber(value['price']) ||
		!isRatingKey(value['rating'])
	) {
		return undefined;
	}
	const food = validateMealFood(value['food']);
	if (food === undefined) {
		return undefined;
	}

	return {
		beverage: value['beverage'],
		food,
		price: value['price'],
		rating: value['rating'],
	};
}

export function validateSuggestedMealResult(
	value: unknown
): ISuggestedMeal[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const result: ISuggestedMeal[] = [];
	for (const item of value) {
		const meal = validateSuggestedMeal(item);
		if (meal === undefined) {
			return undefined;
		}
		result.push(meal);
	}
	return result;
}

function validateSpecialGuestPlanMeal(
	value: unknown
): ICachedSpecialGuestPlanRecommendationMeal | undefined {
	if (
		!checkIsRecord(value) ||
		!isCooker(value['cooker']) ||
		!isNullableNonNegativeSafeInteger(value['dataIndex']) ||
		!isNullableNonNegativeSafeInteger(value['recommendedSetIndex']) ||
		value['source'] !== 'recommended' ||
		!isNonNegativeSafeInteger(value['visibleIndex']) ||
		!checkIsRecord(value['evaluation']) ||
		typeof value['evaluation']['isDarkMatter'] !== 'boolean' ||
		!isFiniteNumber(value['evaluation']['price']) ||
		!(
			value['evaluation']['rating'] === null ||
			isRatingKey(value['evaluation']['rating'])
		) ||
		!checkIsRecord(value['meal']) ||
		!isBeverage(value['meal']['beverage']) ||
		typeof value['meal']['hasMystiaCooker'] !== 'boolean' ||
		!checkIsRecord(value['meal']['order']) ||
		!isBeverageTagOrNull(value['meal']['order']['beverageTag']) ||
		!isFoodTagOrNull(value['meal']['order']['foodTag'])
	) {
		return undefined;
	}
	const food = validateMealFood(value['meal']['food']);
	if (food === undefined) {
		return undefined;
	}

	return {
		cooker: value['cooker'],
		dataIndex: value['dataIndex'],
		evaluation: {
			isDarkMatter: value['evaluation']['isDarkMatter'],
			price: value['evaluation']['price'],
			rating: value['evaluation']['rating'],
		},
		meal: {
			beverage: value['meal']['beverage'],
			food,
			hasMystiaCooker: value['meal']['hasMystiaCooker'],
			order: {
				beverageTag: value['meal']['order']['beverageTag'],
				foodTag: value['meal']['order']['foodTag'],
			},
		},
		recommendedSetIndex: value['recommendedSetIndex'],
		source: 'recommended',
		visibleIndex: value['visibleIndex'],
	};
}

export function validateSpecialGuestPlanResult(
	value: unknown
): TSpecialGuestPlanRecommendationCacheResult | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const result: TSpecialGuestPlanRecommendationCacheResult = [];
	for (const item of value) {
		const meal = validateSpecialGuestPlanMeal(item);
		if (meal === undefined) {
			return undefined;
		}
		result.push(meal);
	}
	return result;
}
