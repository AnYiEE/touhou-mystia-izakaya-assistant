import {
	type ISyncNamespaceSerializer,
	SYNC_NAMESPACE_MAP,
} from '@/lib/account/sync';
import { type TBeverageName, type TBeverageTag, type TRecipeTag } from '@/data';
import { customerRareStore } from '@/stores/customer-rare';
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
import { checkBeverageTag, checkRecipeTag } from './tags';
import { isPlainObject } from './utils';

export interface ICustomerRareMeal {
	beverage: TBeverageName;
	hasMystiaCooker: boolean;
	order: { beverageTag: TBeverageTag | null; recipeTag: TRecipeTag | null };
	recipe: IMealRecipe;
}

export type TCustomerRareMealsSnapshot = TMealSnapshot<ICustomerRareMeal>;

function validateCustomerRareMeal(data: unknown): data is ICustomerRareMeal {
	return (
		isPlainObject(data) &&
		checkBeverageName(data['beverage']) &&
		typeof data['hasMystiaCooker'] === 'boolean' &&
		isPlainObject(data['order']) &&
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

function normalizeCustomerRareMealsSnapshot(data: TCustomerRareMealsSnapshot) {
	return normalizeMealSnapshot(data, normalizeCustomerRareMeal, 'rare');
}

function getLocalCustomerRareMealsSnapshot(data: unknown) {
	if (!isPlainObject(data)) {
		return {};
	}

	const snapshot = Object.entries(data).reduce<TCustomerRareMealsSnapshot>(
		(result, [customerName, meals]) => {
			if (!Array.isArray(meals)) {
				return result;
			}

			const validMeals = meals.filter(validateCustomerRareMeal);
			if (validMeals.length > 0) {
				result[customerName] = validMeals;
			}

			return result;
		},
		{}
	);

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
			cloneJsonObject(customerRareStore.persistence.meals.get())
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
		customerRareStore.persistence.meals.set(
			normalizeCustomerRareMealsSnapshot(data)
		);
	},
	validate(data): data is TCustomerRareMealsSnapshot {
		return validateMealSnapshot(data, {
			customerType: 'rare',
			validateMeal: validateCustomerRareMeal,
		});
	},
} satisfies ISyncNamespaceSerializer<TCustomerRareMealsSnapshot>;
