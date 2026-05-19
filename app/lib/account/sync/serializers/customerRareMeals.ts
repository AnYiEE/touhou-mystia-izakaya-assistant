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

export const customerRareMealsSerializer = {
	deserialize(data) {
		return this.migrate(data, 1);
	},
	getDefaultSnapshot() {
		return {};
	},
	getLocalSnapshot() {
		return cloneJsonObject(customerRareStore.persistence.meals.get());
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

		return data;
	},
	serialize(data) {
		return data;
	},
	setLocalSnapshot(data) {
		customerRareStore.persistence.meals.set(data);
	},
	validate(data): data is TCustomerRareMealsSnapshot {
		return validateMealSnapshot(data, {
			customerType: 'rare',
			validateMeal: validateCustomerRareMeal,
		});
	},
} satisfies ISyncNamespaceSerializer<TCustomerRareMealsSnapshot>;
