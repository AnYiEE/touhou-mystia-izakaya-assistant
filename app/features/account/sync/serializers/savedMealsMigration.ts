import type {
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import { createVersionedMigrator } from '@/shared/utilities/state/versionedMigration';

import {
	migrateLegacyNormalGuestMealsSnapshotV1ToV2,
	migrateLegacyNormalGuestMealsSnapshotV2ToV3,
	migrateLegacySpecialGuestMealsSnapshotV1ToV2,
	migrateLegacySpecialGuestMealsSnapshotV2ToV3,
	validateLegacyNormalGuestSavedMealV2,
	validateLegacySpecialGuestSavedMealV2,
} from './legacySavedMeals';
import {
	type TMealSnapshot,
	checkBeverage,
	normalizeMealFood,
	normalizeMealSnapshot,
	validateLegacyMealSnapshot,
	validateMealSnapshot,
	validateNormalGuestSavedMeal,
	validateSpecialGuestSavedMeal,
} from './meals';
import { checkBeverageTag, checkFoodTag } from './tags';
import { hasExactKeys } from './utils';

function normalizeSavedMealBeverage(value: unknown, allowNull: boolean) {
	if (value === null && allowNull) {
		return null;
	}
	const numericValue =
		typeof value === 'string' && /^\d+$/u.test(value)
			? Number(value)
			: value;
	return typeof numericValue === 'number' && checkBeverage(numericValue)
		? numericValue
		: null;
}

function normalizeNormalGuestSavedMeal(
	data: INormalGuestSavedMeal
): INormalGuestSavedMeal {
	const beverage = normalizeSavedMealBeverage(data.beverage, true);
	if (beverage === null && data.beverage !== null) {
		return data;
	}
	return { ...data, beverage, food: normalizeMealFood(data.food) };
}

function normalizeSpecialGuestSavedMeal(
	data: ISpecialGuestSavedMeal
): ISpecialGuestSavedMeal {
	const beverage = normalizeSavedMealBeverage(data.beverage, false);
	if (beverage === null) {
		return data;
	}
	if (
		!isObjectTagRecord(data.order) ||
		!hasExactKeys(data.order, ['beverageTag', 'foodTag']) ||
		(data.order.beverageTag !== null &&
			!checkBeverageTag(data.order.beverageTag)) ||
		(data.order.foodTag !== null && !checkFoodTag(data.order.foodTag))
	) {
		return data;
	}
	return {
		...data,
		beverage,
		food: normalizeMealFood(data.food),
		hasMystiaCooker:
			typeof data.hasMystiaCooker === 'boolean'
				? data.hasMystiaCooker
				: false,
		order: {
			beverageTag: data.order.beverageTag,
			foodTag: data.order.foodTag,
		},
	};
}

export function normalizeNormalGuestMealsSnapshot(data: unknown) {
	return normalizeMealSnapshot(
		data,
		(meal) => normalizeNormalGuestSavedMeal(meal as INormalGuestSavedMeal),
		'normal',
		(meal) => validateNormalGuestSavedMeal(meal)
	);
}

export function normalizeSpecialGuestMealsSnapshot(data: unknown) {
	return normalizeMealSnapshot(
		data,
		(meal) =>
			normalizeSpecialGuestSavedMeal(meal as ISpecialGuestSavedMeal),
		'special',
		(meal) => validateSpecialGuestSavedMeal(meal)
	);
}

export function validateNormalGuestMealsSnapshot(
	data: unknown
): data is TMealSnapshot<INormalGuestSavedMeal> {
	return validateMealSnapshot(data, {
		guestType: 'normal',
		validateMeal: validateNormalGuestSavedMeal,
	});
}

export function validateSpecialGuestMealsSnapshot(
	data: unknown
): data is TMealSnapshot<ISpecialGuestSavedMeal> {
	return validateMealSnapshot(data, {
		guestType: 'special',
		validateMeal: validateSpecialGuestSavedMeal,
	});
}

const normalGuestMealsMigrator = createVersionedMigrator({
	currentVersion: 3,
	migrations: {
		1: (value) =>
			migrateLegacyNormalGuestMealsSnapshotV1ToV2(
				value as Parameters<
					typeof migrateLegacyNormalGuestMealsSnapshotV1ToV2
				>[0]
			),
		2: (value) =>
			migrateLegacyNormalGuestMealsSnapshotV2ToV3(
				value as Parameters<
					typeof migrateLegacyNormalGuestMealsSnapshotV2ToV3
				>[0]
			),
	},
	minVersion: 1,
});

const specialGuestMealsMigrator = createVersionedMigrator({
	currentVersion: 3,
	migrations: {
		1: (value) =>
			migrateLegacySpecialGuestMealsSnapshotV1ToV2(
				value as Parameters<
					typeof migrateLegacySpecialGuestMealsSnapshotV1ToV2
				>[0]
			),
		2: (value) =>
			migrateLegacySpecialGuestMealsSnapshotV2ToV3(
				value as Parameters<
					typeof migrateLegacySpecialGuestMealsSnapshotV2ToV3
				>[0]
			),
	},
	minVersion: 1,
});

export function migrateNormalGuestMealsSnapshot(
	data: unknown,
	version: number
) {
	const migratedData =
		version === 3 ? data : normalGuestMealsMigrator(data, version);
	return normalizeNormalGuestMealsSnapshot(migratedData);
}

export function migrateUnversionedNormalGuestMealsSnapshot(data: unknown) {
	if (validateNormalGuestMealsSnapshot(data)) {
		return migrateNormalGuestMealsSnapshot(data, 3);
	}
	if (
		validateLegacyMealSnapshot(data, {
			guestType: 'normal',
			validateMeal: validateLegacyNormalGuestSavedMealV2,
		})
	) {
		return migrateNormalGuestMealsSnapshot(data, 2);
	}

	return migrateNormalGuestMealsSnapshot(data, 1);
}

export function migrateSpecialGuestMealsSnapshot(
	data: unknown,
	version: number
) {
	const migratedData =
		version === 3 ? data : specialGuestMealsMigrator(data, version);
	return normalizeSpecialGuestMealsSnapshot(migratedData);
}

export function migrateUnversionedSpecialGuestMealsSnapshot(data: unknown) {
	if (validateSpecialGuestMealsSnapshot(data)) {
		return migrateSpecialGuestMealsSnapshot(data, 3);
	}
	if (
		validateLegacyMealSnapshot(data, {
			guestType: 'special',
			validateMeal: validateLegacySpecialGuestSavedMealV2,
		})
	) {
		return migrateSpecialGuestMealsSnapshot(data, 2);
	}

	return migrateSpecialGuestMealsSnapshot(data, 1);
}
