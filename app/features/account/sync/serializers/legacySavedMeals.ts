import type { TBeverageName } from '@/domain/data/beverages/types';
import type {
	TBeverageTagLabel,
	TFoodTagLabel,
} from '@/domain/data/tags/types';
import type {
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	type ILegacyMealFoodV1,
	type ILegacyMealFoodV2,
	type TMealSnapshot,
	checkLegacyBeverage,
	migrateLegacyMealSnapshot,
	migrateMealFoodV1ToV2,
	migrateMealFoodV2,
	resolveLegacyBeverage,
	validateLegacyMealFoodV1,
	validateLegacyMealFoodV2,
} from './meals';
import {
	checkLegacyBeverageTag,
	checkLegacyFoodTag,
	resolveLegacyBeverageTag,
	resolveLegacyFoodTag,
} from './tags';
import { hasExactKeys } from './utils';

interface ILegacyNormalGuestSavedMealV1 {
	beverage: TBeverageName | null;
	recipe: ILegacyMealFoodV1;
}

interface ILegacyNormalGuestSavedMealV2 {
	beverage: TBeverageName | null;
	recipe: ILegacyMealFoodV2;
}

interface ILegacySpecialGuestOrder {
	beverageTag: TBeverageTagLabel | null;
	recipeTag: TFoodTagLabel | null;
}

interface ILegacySpecialGuestSavedMealV1 {
	beverage: TBeverageName;
	hasMystiaCooker: boolean;
	order: ILegacySpecialGuestOrder;
	recipe: ILegacyMealFoodV1;
}

interface ILegacySpecialGuestSavedMealV2 {
	beverage: TBeverageName;
	hasMystiaCooker: boolean;
	order: ILegacySpecialGuestOrder;
	recipe: ILegacyMealFoodV2;
}

export function validateLegacyNormalGuestSavedMealV1(
	data: unknown
): data is ILegacyNormalGuestSavedMealV1 {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null || checkLegacyBeverage(data['beverage'])) &&
		validateLegacyMealFoodV1(data['recipe'])
	);
}

export function validateLegacyNormalGuestSavedMealV2(
	data: unknown
): data is ILegacyNormalGuestSavedMealV2 {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null || checkLegacyBeverage(data['beverage'])) &&
		validateLegacyMealFoodV2(data['recipe'])
	);
}

function migrateLegacyNormalGuestSavedMealV1ToV2(
	data: ILegacyNormalGuestSavedMealV1
): ILegacyNormalGuestSavedMealV2 {
	return {
		beverage: data.beverage,
		recipe: migrateMealFoodV1ToV2(data.recipe),
	};
}

function migrateLegacyNormalGuestSavedMealV2ToV3(
	data: ILegacyNormalGuestSavedMealV2
): INormalGuestSavedMeal {
	return {
		beverage:
			data.beverage === null
				? null
				: resolveLegacyBeverage(data.beverage),
		food: migrateMealFoodV2(data.recipe),
	};
}

function validateLegacySpecialGuestSavedMeal(
	data: unknown,
	validateFood: (food: unknown) => boolean
) {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, [
			'beverage',
			'hasMystiaCooker',
			'order',
			'recipe',
		]) &&
		checkLegacyBeverage(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
		hasExactKeys(data['order'], ['beverageTag', 'recipeTag']) &&
		(data['order']['beverageTag'] === null ||
			checkLegacyBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkLegacyFoodTag(data['order']['recipeTag'])) &&
		validateFood(data['recipe'])
	);
}

export function validateLegacySpecialGuestSavedMealV1(
	data: unknown
): data is ILegacySpecialGuestSavedMealV1 {
	return validateLegacySpecialGuestSavedMeal(data, validateLegacyMealFoodV1);
}

export function validateLegacySpecialGuestSavedMealV2(
	data: unknown
): data is ILegacySpecialGuestSavedMealV2 {
	return validateLegacySpecialGuestSavedMeal(data, validateLegacyMealFoodV2);
}

function migrateLegacySpecialGuestOrder(
	order: ILegacySpecialGuestOrder
): ISpecialGuestSavedMeal['order'] {
	return {
		beverageTag:
			order.beverageTag === null
				? null
				: resolveLegacyBeverageTag(order.beverageTag),
		foodTag:
			order.recipeTag === null
				? null
				: resolveLegacyFoodTag(order.recipeTag),
	};
}

function migrateLegacySpecialGuestSavedMealV1ToV2(
	data: ILegacySpecialGuestSavedMealV1
): ILegacySpecialGuestSavedMealV2 {
	return {
		beverage: data.beverage,
		hasMystiaCooker: data.hasMystiaCooker,
		order: {
			beverageTag: data.order.beverageTag,
			recipeTag: data.order.recipeTag,
		},
		recipe: migrateMealFoodV1ToV2(data.recipe),
	};
}

function migrateLegacySpecialGuestSavedMealV2ToV3(
	data: ILegacySpecialGuestSavedMealV2
): ISpecialGuestSavedMeal {
	return {
		beverage: resolveLegacyBeverage(data.beverage),
		food: migrateMealFoodV2(data.recipe),
		hasMystiaCooker: data.hasMystiaCooker,
		order: migrateLegacySpecialGuestOrder(data.order),
	};
}

function migrateLegacyMealSnapshotV1ToV2<TMealV1, TMealV2>(
	data: TMealSnapshot<TMealV1>,
	migrateMeal: (meal: TMealV1) => TMealV2
) {
	return Object.entries(data).reduce<TMealSnapshot<TMealV2>>(
		(result, [guestName, meals]) => {
			result[guestName] = meals.map(migrateMeal);
			return result;
		},
		{}
	);
}

export function migrateLegacyNormalGuestMealsSnapshotV1ToV2(
	data: TMealSnapshot<ILegacyNormalGuestSavedMealV1>
) {
	return migrateLegacyMealSnapshotV1ToV2(
		data,
		migrateLegacyNormalGuestSavedMealV1ToV2
	);
}

export function migrateLegacyNormalGuestMealsSnapshotV2ToV3(
	data: TMealSnapshot<ILegacyNormalGuestSavedMealV2>
): TMealSnapshot<INormalGuestSavedMeal> {
	return migrateLegacyMealSnapshot(data, {
		guestType: 'normal',
		migrateMeal: migrateLegacyNormalGuestSavedMealV2ToV3,
	});
}

export function migrateLegacySpecialGuestMealsSnapshotV1ToV2(
	data: TMealSnapshot<ILegacySpecialGuestSavedMealV1>
) {
	return migrateLegacyMealSnapshotV1ToV2(
		data,
		migrateLegacySpecialGuestSavedMealV1ToV2
	);
}

export function migrateLegacySpecialGuestMealsSnapshotV2ToV3(
	data: TMealSnapshot<ILegacySpecialGuestSavedMealV2>
): TMealSnapshot<ISpecialGuestSavedMeal> {
	return migrateLegacyMealSnapshot(data, {
		guestType: 'special',
		migrateMeal: migrateLegacySpecialGuestSavedMealV2ToV3,
	});
}
