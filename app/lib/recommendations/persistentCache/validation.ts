import {
	DYNAMIC_TAG_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { IResolvedCustomerRarePlanGroup } from '@/types';
import { type ISuggestedMeal } from '@/utils/customer/customer_rare/suggestMeals';
import { Beverage, CustomerRare, Ingredient, Recipe } from '@/utils';

type TCustomerRarePlanMeals = IResolvedCustomerRarePlanGroup['meals'];

const beverageInstance = Beverage.getInstance();
const customerInstance = CustomerRare.getInstance();
const ingredientInstance = Ingredient.getInstance();
const recipeInstance = Recipe.getInstance();

const beverageNames = new Set<string>(beverageInstance.getNames());
const ingredientNames = new Set<string>(ingredientInstance.getNames());
const recipeNames = new Set<string>(recipeInstance.getNames());
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

function isNonNegativeIntegerOrNull(value: unknown): value is number | null {
	return (
		value === null ||
		(typeof value === 'number' && Number.isInteger(value) && value >= 0)
	);
}

function isBeverageName(value: unknown): value is TBeverageName {
	return typeof value === 'string' && beverageNames.has(value);
}

function isIngredientName(value: unknown): value is TIngredientName {
	return typeof value === 'string' && ingredientNames.has(value);
}

function isRecipeName(value: unknown): value is TRecipeName {
	return typeof value === 'string' && recipeNames.has(value);
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

function validateMealRecipe(value: unknown) {
	if (
		!isRecord(value) ||
		!isRecipeName(value['name']) ||
		!Array.isArray(value['extraIngredients']) ||
		!value['extraIngredients'].every(isIngredientName)
	) {
		return;
	}

	return {
		extraIngredients: [...value['extraIngredients']],
		name: value['name'],
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
		!isNonNegativeIntegerOrNull(value['dataIndex']) ||
		!isNonNegativeIntegerOrNull(value['recommendedSetIndex']) ||
		value['source'] !== 'recommended' ||
		typeof value['visibleIndex'] !== 'number' ||
		!Number.isInteger(value['visibleIndex']) ||
		value['visibleIndex'] < 0 ||
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
