import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import type { ISyncNamespaceSerializer } from '@/features/account/sync/types';
import {
	type TCustomerRareMealsPersistenceSnapshot,
	readCustomerRareMealsPersistenceSnapshot,
	replaceCustomerRareMealsPersistenceSnapshot,
} from '@/features/catalog/customers/rare/client/state/accountSync';
import type { ICustomerRareMeal } from '@/features/customerPlans/contracts';

import { cloneJsonObject } from '@/shared/utilities/objects/cloneJsonObject';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	type TMealSnapshot,
	checkBeverageName,
	mergeMealSnapshot,
	normalizeMealRecipe,
	normalizeMealSnapshot,
	validateMealRecipe,
	validateMealSnapshot,
} from './meals';
import { checkBeverageTag, checkRecipeTag } from './tags';

function validateCustomerRareMeal(data: unknown): data is ICustomerRareMeal {
	return (
		isObjectTagRecord(data) &&
		checkBeverageName(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isObjectTagRecord(data['order']) &&
		(data['order']['beverageTag'] === null ||
			checkBeverageTag(data['order']['beverageTag'])) &&
		(data['order']['recipeTag'] === null ||
			checkRecipeTag(data['order']['recipeTag'])) &&
		validateMealRecipe(data['recipe'])
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
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return getLocalCustomerRareMealsSnapshot(
			cloneJsonObject(readCustomerRareMealsPersistenceSnapshot())
		);
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.customerRareMeals,
		});
	},
	migrate(data, version) {
		if (version !== 1) {
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
