import type {
	INormalGuestSavedMeal,
	ISpecialGuestSavedMeal,
} from '@/domain/meals/types';

import {
	migrateLegacyNormalGuestMealsSnapshotV1ToV2,
	migrateLegacyNormalGuestMealsSnapshotV2ToV3,
	migrateLegacySpecialGuestMealsSnapshotV1ToV2,
	migrateLegacySpecialGuestMealsSnapshotV2ToV3,
	validateLegacyNormalGuestSavedMealV1,
	validateLegacyNormalGuestSavedMealV2,
	validateLegacySpecialGuestSavedMealV1,
	validateLegacySpecialGuestSavedMealV2,
} from './legacySavedMeals';
import {
	type TMealSnapshot,
	normalizeMealFood,
	normalizeMealSnapshot,
	validateLegacyMealSnapshot,
	validateMealSnapshot,
	validateNormalGuestSavedMeal,
	validateSpecialGuestSavedMeal,
} from './meals';

function normalizeNormalGuestSavedMeal(
	data: INormalGuestSavedMeal
): INormalGuestSavedMeal {
	return { beverage: data.beverage, food: normalizeMealFood(data.food) };
}

function normalizeSpecialGuestSavedMeal(
	data: ISpecialGuestSavedMeal
): ISpecialGuestSavedMeal {
	return {
		beverage: data.beverage,
		food: normalizeMealFood(data.food),
		hasMystiaCooker: data.hasMystiaCooker,
		order: {
			beverageTag: data.order.beverageTag,
			foodTag: data.order.foodTag,
		},
	};
}

export function normalizeNormalGuestMealsSnapshot(
	data: TMealSnapshot<INormalGuestSavedMeal>
) {
	return normalizeMealSnapshot(data, normalizeNormalGuestSavedMeal, 'normal');
}

export function normalizeSpecialGuestMealsSnapshot(
	data: TMealSnapshot<ISpecialGuestSavedMeal>
) {
	return normalizeMealSnapshot(
		data,
		normalizeSpecialGuestSavedMeal,
		'special'
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

export function migrateNormalGuestMealsSnapshot(
	data: unknown,
	version: number
) {
	let migratedData = data;
	let schemaVersion = version;
	if (schemaVersion === 1) {
		if (
			!validateLegacyMealSnapshot(migratedData, {
				guestType: 'normal',
				validateMeal: validateLegacyNormalGuestSavedMealV1,
			})
		) {
			throw new Error('invalid-normal-guest-meals');
		}
		migratedData =
			migrateLegacyNormalGuestMealsSnapshotV1ToV2(migratedData);
		schemaVersion = 2;
	}
	if (schemaVersion === 2) {
		if (
			!validateLegacyMealSnapshot(migratedData, {
				guestType: 'normal',
				validateMeal: validateLegacyNormalGuestSavedMealV2,
			})
		) {
			throw new Error('invalid-normal-guest-meals');
		}
		migratedData =
			migrateLegacyNormalGuestMealsSnapshotV2ToV3(migratedData);
		schemaVersion = 3;
	}
	if (schemaVersion !== 3) {
		throw new Error('unsupported-normal-guest-meals-schema-version');
	}
	if (!validateNormalGuestMealsSnapshot(migratedData)) {
		throw new Error('invalid-normal-guest-meals');
	}

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
	let migratedData = data;
	let schemaVersion = version;
	if (schemaVersion === 1) {
		if (
			!validateLegacyMealSnapshot(migratedData, {
				guestType: 'special',
				validateMeal: validateLegacySpecialGuestSavedMealV1,
			})
		) {
			throw new Error('invalid-special-guest-meals');
		}
		migratedData =
			migrateLegacySpecialGuestMealsSnapshotV1ToV2(migratedData);
		schemaVersion = 2;
	}
	if (schemaVersion === 2) {
		if (
			!validateLegacyMealSnapshot(migratedData, {
				guestType: 'special',
				validateMeal: validateLegacySpecialGuestSavedMealV2,
			})
		) {
			throw new Error('invalid-special-guest-meals');
		}
		migratedData =
			migrateLegacySpecialGuestMealsSnapshotV2ToV3(migratedData);
		schemaVersion = 3;
	}
	if (schemaVersion !== 3) {
		throw new Error('unsupported-special-guest-meals-schema-version');
	}
	if (!validateSpecialGuestMealsSnapshot(migratedData)) {
		throw new Error('invalid-special-guest-meals');
	}

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
