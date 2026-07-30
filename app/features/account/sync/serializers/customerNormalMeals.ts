import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type ICustomerNormalSavedMealSnapshot,
	type TCustomerNormalMealsPersistenceSnapshot,
	readCustomerNormalMealsPersistenceSnapshot,
	replaceCustomerNormalMealsPersistenceSnapshot,
} from '@/features/catalog/customers/normal/client/state/accountSync';

import { cloneJsonObject } from '@/shared/utilities/objects/cloneJsonObject';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	type IMealRecipeV1,
	type TMealSnapshot,
	checkBeverageName,
	mergeMealSnapshot,
	migrateMealRecipeV1,
	normalizeMealRecipe,
	normalizeMealSnapshot,
	validateMealRecipe,
	validateMealRecipeV1,
	validateMealSnapshot,
} from './meals';
import { hasExactKeys } from './utils';

type TCustomerNormalSavedMealSnapshotV1 = Omit<
	ICustomerNormalSavedMealSnapshot,
	'recipe'
> & { recipe: IMealRecipeV1 };

function validateCustomerNormalMeal(
	data: unknown
): data is ICustomerNormalSavedMealSnapshot {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null || checkBeverageName(data['beverage'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function validateCustomerNormalMealV1(
	data: unknown
): data is TCustomerNormalSavedMealSnapshotV1 {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, ['beverage', 'recipe']) &&
		(data['beverage'] === null || checkBeverageName(data['beverage'])) &&
		validateMealRecipeV1(data['recipe'])
	);
}

function normalizeCustomerNormalMeal(
	data: ICustomerNormalSavedMealSnapshot
): ICustomerNormalSavedMealSnapshot {
	return {
		beverage: data.beverage,
		recipe: normalizeMealRecipe(data.recipe),
	};
}

function migrateCustomerNormalMealV1(
	data: TCustomerNormalSavedMealSnapshotV1
): ICustomerNormalSavedMealSnapshot {
	return {
		beverage: data.beverage,
		recipe: migrateMealRecipeV1(data.recipe),
	};
}

function normalizeCustomerNormalMealsSnapshot(
	data: TMealSnapshot<ICustomerNormalSavedMealSnapshot>
): TCustomerNormalMealsPersistenceSnapshot {
	return normalizeMealSnapshot(data, normalizeCustomerNormalMeal, 'normal');
}

function getLocalCustomerNormalMealsSnapshot(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return {};
	}

	const snapshot = Object.entries(data).reduce<
		TMealSnapshot<ICustomerNormalSavedMealSnapshot>
	>((result, [customerName, meals]) => {
		if (!Array.isArray(meals)) {
			return result;
		}

		const validMeals = meals.filter(validateCustomerNormalMeal);
		if (validMeals.length > 0) {
			result[customerName] = validMeals;
		}

		return result;
	}, {});

	return normalizeCustomerNormalMealsSnapshot(snapshot);
}

export const customerNormalMealsSerializer = {
	deserialize(data) {
		return this.migrate(data, 2);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return getLocalCustomerNormalMealsSnapshot(
			cloneJsonObject(readCustomerNormalMealsPersistenceSnapshot())
		);
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.customerNormalMeals,
		});
	},
	migrate(data, version) {
		if (version === 1) {
			if (
				!validateMealSnapshot(data, {
					customerType: 'normal',
					validateMeal: validateCustomerNormalMealV1,
				})
			) {
				throw new Error('invalid-customer-normal-meals');
			}

			return normalizeMealSnapshot(
				data,
				migrateCustomerNormalMealV1,
				'normal'
			);
		}
		if (version !== 2) {
			throw new Error('unsupported-customer-normal-meals-schema-version');
		}

		if (!this.validate(data)) {
			throw new Error('invalid-customer-normal-meals');
		}

		return normalizeCustomerNormalMealsSnapshot(data);
	},
	serialize(data) {
		return normalizeCustomerNormalMealsSnapshot(data);
	},
	setLocalSnapshot(data) {
		replaceCustomerNormalMealsPersistenceSnapshot(
			normalizeCustomerNormalMealsSnapshot(data)
		);
	},
	validate(data): data is TCustomerNormalMealsPersistenceSnapshot {
		return validateMealSnapshot(data, {
			customerType: 'normal',
			validateMeal: validateCustomerNormalMeal,
		});
	},
} satisfies ISyncNamespaceSerializer<TCustomerNormalMealsPersistenceSnapshot>;
