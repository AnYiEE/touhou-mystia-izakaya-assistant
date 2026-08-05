import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import type { TBeverageName } from '@/domain/data/beverages/types';
import { DYNAMIC_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealRecipe } from '@/domain/meals/types';
import type { ISuggestedMeal } from '@/domain/recommendations/types';

import type { IResolvedCustomerRarePlanGroup } from '@/features/customerPlans/contracts';

import {
	isNonNegativeSafeInteger,
	isNullableNonNegativeSafeInteger,
} from '@/shared/utilities/numbers/check';

type TCustomerRarePlanMeals = IResolvedCustomerRarePlanGroup['meals'];

const beverageInstance = Beverage.getInstance();
const customerInstance = CustomerRare.getInstance();
const ingredientInstance = Ingredient.getInstance();
const recipeInstance = Recipe.getInstance();

const beverageNames = new Set<string>(beverageInstance.getNames());
const beverageTags = new Set<string>([
	...beverageInstance.getValuesByProp('tags'),
	...customerInstance.getValuesByProp('beverageTags'),
]);
const recipeTags = new Set<string>([
	...customerInstance.getValuesByProp(['negativeTags', 'positiveTags']),
	...ingredientInstance.getValuesByProp('tags'),
	...recipeInstance.getValuesByProp(['negativeTags', 'positiveTags']),
	...Object.values(DYNAMIC_TAG_MAP),
]);
const ratingKeys = new Set<string>(['bad', 'exbad', 'exgood', 'good', 'norm']);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function isBeverageName(value: unknown): value is TBeverageName {
	return typeof value === 'string' && beverageNames.has(value);
}

function isBeverageTagOrNull(value: unknown): value is TBeverageTag | null {
	return (
		value === null || (typeof value === 'string' && beverageTags.has(value))
	);
}

function isRecipeTagOrNull(value: unknown): value is TRecipeTag | null {
	return (
		value === null || (typeof value === 'string' && recipeTags.has(value))
	);
}

function isRatingKey(value: unknown): value is TRatingKey {
	return typeof value === 'string' && ratingKeys.has(value);
}

function validateMealRecipe(value: unknown): IMealRecipe | undefined {
	if (!recipeInstance.isMealRecipe(value)) {
		return;
	}

	return {
		extraIngredients: [...value.extraIngredients],
		name: value.name,
		recipeId: value.recipeId,
	};
}

function validateSuggestedMeal(value: unknown): ISuggestedMeal | undefined {
	if (
		!isRecord(value) ||
		!isBeverageName(value['beverage']) ||
		!isFiniteNumber(value['price']) ||
		!isRatingKey(value['rating'])
	) {
		return undefined;
	}
	const recipe = validateMealRecipe(value['recipe']);
	if (recipe === undefined) {
		return undefined;
	}

	return {
		beverage: value['beverage'],
		price: value['price'],
		rating: value['rating'],
		recipe,
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

function validateCustomerRarePlanMeal(
	value: unknown
): TCustomerRarePlanMeals[number] | undefined {
	if (
		!isRecord(value) ||
		!isNullableNonNegativeSafeInteger(value['dataIndex']) ||
		!isNullableNonNegativeSafeInteger(value['recommendedSetIndex']) ||
		value['source'] !== 'recommended' ||
		!isNonNegativeSafeInteger(value['visibleIndex']) ||
		!isRecord(value['evaluation']) ||
		typeof value['evaluation']['isDarkMatter'] !== 'boolean' ||
		!isFiniteNumber(value['evaluation']['price']) ||
		!(
			value['evaluation']['rating'] === null ||
			isRatingKey(value['evaluation']['rating'])
		) ||
		!isRecord(value['meal']) ||
		!isBeverageName(value['meal']['beverage']) ||
		typeof value['meal']['hasMystiaCooker'] !== 'boolean' ||
		!isRecord(value['meal']['order']) ||
		!isBeverageTagOrNull(value['meal']['order']['beverageTag']) ||
		!isRecipeTagOrNull(value['meal']['order']['recipeTag'])
	) {
		return undefined;
	}
	const recipe = validateMealRecipe(value['meal']['recipe']);
	if (recipe === undefined) {
		return undefined;
	}

	return {
		dataIndex: value['dataIndex'],
		evaluation: {
			isDarkMatter: value['evaluation']['isDarkMatter'],
			price: value['evaluation']['price'],
			rating: value['evaluation']['rating'],
		},
		meal: {
			beverage: value['meal']['beverage'],
			hasMystiaCooker: value['meal']['hasMystiaCooker'],
			order: {
				beverageTag: value['meal']['order']['beverageTag'],
				recipeTag: value['meal']['order']['recipeTag'],
			},
			recipe,
		},
		recommendedSetIndex: value['recommendedSetIndex'],
		source: 'recommended',
		visibleIndex: value['visibleIndex'],
	};
}

export function validateCustomerRarePlanResult(
	value: unknown
): TCustomerRarePlanMeals | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const result: TCustomerRarePlanMeals = [];
	for (const item of value) {
		const meal = validateCustomerRarePlanMeal(item);
		if (meal === undefined) {
			return undefined;
		}
		result.push(meal);
	}
	return result;
}
