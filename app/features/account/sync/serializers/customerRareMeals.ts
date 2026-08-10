import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TCustomerRareMealsPersistenceSnapshot,
	readCustomerRareMealsPersistenceSnapshot,
	replaceCustomerRareMealsPersistenceSnapshot,
} from '@/features/catalog/customers/rare/client/state/accountSync';
import type { ICustomerRareMeal } from '@/features/customerPlans/contracts';

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
import { checkBeverageTag, checkRecipeTag } from './tags';
import { hasExactKeys } from './utils';

type TCustomerRareMealV1 = Omit<ICustomerRareMeal, 'recipe'> & {
	recipe: IMealRecipeV1;
};

function validateCustomerRareMeal(data: unknown): data is ICustomerRareMeal {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, [
			'beverage',
			'hasMystiaCooker',
			'order',
			'recipe',
		]) &&
		checkBeverageName(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
		hasExactKeys(data['order'], ['beverageTag', 'recipeTag']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkRecipeTag(data['order']['recipeTag'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function validateCustomerRareMealV1(
	data: unknown
): data is TCustomerRareMealV1 {
	return (
		isObjectTagRecord(data) &&
		hasExactKeys(data, [
			'beverage',
			'hasMystiaCooker',
			'order',
			'recipe',
		]) &&
		checkBeverageName(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
		hasExactKeys(data['order'], ['beverageTag', 'recipeTag']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkRecipeTag(data['order']['recipeTag'])) &&
		validateMealRecipeV1(data['recipe'])
	);
}

function normalizeCustomerRareMeal(data: ICustomerRareMeal): ICustomerRareMeal {
	return {
		beverage: data.beverage,
		hasMystiaCooker: data.hasMystiaCooker,
		order: {
			beverageTag: data.order.beverageTag,
			recipeTag: data.order.recipeTag,
		},
		recipe: normalizeMealRecipe(data.recipe),
	};
}

function migrateCustomerRareMealV1(
	data: TCustomerRareMealV1
): ICustomerRareMeal {
	return {
		beverage: data.beverage,
		hasMystiaCooker: data.hasMystiaCooker,
		order: {
			beverageTag: data.order.beverageTag,
			recipeTag: data.order.recipeTag,
		},
		recipe: migrateMealRecipeV1(data.recipe),
	};
}

function normalizeCustomerRareMealsSnapshot(
	data: TMealSnapshot<ICustomerRareMeal>
): TCustomerRareMealsPersistenceSnapshot {
	return normalizeMealSnapshot(data, normalizeCustomerRareMeal, 'rare');
}

function getLocalCustomerRareMealsSnapshot(data: unknown) {
	if (!isObjectTagRecord(data)) {
		return {};
	}

	const snapshot = Object.entries(data).reduce<
		TMealSnapshot<ICustomerRareMeal>
	>((result, [customerName, meals]) => {
		if (!Array.isArray(meals)) {
			return result;
		}

		const validMeals = meals.filter(validateCustomerRareMeal);
		if (validMeals.length > 0) {
			result[customerName] = validMeals;
		}

		return result;
	}, {});

	return normalizeCustomerRareMealsSnapshot(snapshot);
}

export const customerRareMealsSerializer = {
	deserialize(data) {
		return this.migrate(data, 2);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return getLocalCustomerRareMealsSnapshot(
			structuredClone(readCustomerRareMealsPersistenceSnapshot())
		);
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.customerRareMeals,
		});
	},
	migrate(data, version) {
		if (version === 1) {
			if (
				!validateMealSnapshot(data, {
					customerType: 'rare',
					validateMeal: validateCustomerRareMealV1,
				})
			) {
				throw new Error('invalid-customer-rare-meals');
			}

			return normalizeMealSnapshot(
				data,
				migrateCustomerRareMealV1,
				'rare'
			);
		}
		if (version !== 2) {
			throw new Error('unsupported-customer-rare-meals-schema-version');
		}

		if (!this.validate(data)) {
			throw new Error('invalid-customer-rare-meals');
		}

		return normalizeCustomerRareMealsSnapshot(data);
	},
	serialize(data) {
		return normalizeCustomerRareMealsSnapshot(data);
	},
	setLocalSnapshot(data) {
		replaceCustomerRareMealsPersistenceSnapshot(
			normalizeCustomerRareMealsSnapshot(data)
		);
	},
	validate(data): data is TCustomerRareMealsPersistenceSnapshot {
		return validateMealSnapshot(data, {
			customerType: 'rare',
			validateMeal: validateCustomerRareMeal,
		});
	},
} satisfies ISyncNamespaceSerializer<TCustomerRareMealsPersistenceSnapshot>;
