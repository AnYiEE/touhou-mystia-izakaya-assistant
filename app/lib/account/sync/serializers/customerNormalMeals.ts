import {
	type ISyncNamespaceSerializer,
	SYNC_NAMESPACE_MAP,
} from '@/lib/account/sync';
import { customerNormalStore } from '@/stores/customer-normal';
import { type TBeverageName } from '@/data';
import { type IMealRecipe } from '@/types';
import { cloneJsonObject } from '@/utilities';
import {
	type TMealSnapshot,
	checkBeverageName,
	mergeMealSnapshot,
	normalizeMealRecipe,
	normalizeMealSnapshot,
	validateMealRecipe,
	validateMealSnapshot,
} from './meals';
import { isPlainObject } from './utils';

export interface ICustomerNormalMeal {
	beverage: TBeverageName | null;
	recipe: IMealRecipe;
}

export type TCustomerNormalMealsSnapshot = TMealSnapshot<ICustomerNormalMeal>;

function validateCustomerNormalMeal(
	data: unknown
): data is ICustomerNormalMeal {
	return (
		isPlainObject(data) &&
		(data['beverage'] === null || checkBeverageName(data['beverage'])) &&
		validateMealRecipe(data['recipe'])
	);
}

function normalizeCustomerNormalMeal(
	data: ICustomerNormalMeal
): ICustomerNormalMeal {
	return {
		beverage: data.beverage,
		recipe: normalizeMealRecipe(data.recipe),
	};
}

function normalizeCustomerNormalMealsSnapshot(
	data: TCustomerNormalMealsSnapshot
) {
	return normalizeMealSnapshot(data, normalizeCustomerNormalMeal);
}

export const customerNormalMealsSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return normalizeCustomerNormalMealsSnapshot(
			cloneJsonObject(customerNormalStore.persistence.meals.get())
		);
	},
	merge(params) {
		return mergeMealSnapshot({
			...params,
			namespace: SYNC_NAMESPACE_MAP.customerNormalMeals,
		});
	},
	migrate(data, version) {
		if (version !== 1) {
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
		customerNormalStore.persistence.meals.set(
			normalizeCustomerNormalMealsSnapshot(data)
		);
	},
	validate(data): data is TCustomerNormalMealsSnapshot {
		return validateMealSnapshot(data, {
			customerType: 'normal',
			validateMeal: validateCustomerNormalMeal,
		});
	},
} satisfies ISyncNamespaceSerializer<TCustomerNormalMealsSnapshot>;
