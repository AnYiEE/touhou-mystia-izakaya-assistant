import { type StoreApi } from '@davstack/store';
import { type Selection } from '@heroui/table';
import { type Key } from 'react';

import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';
import { evaluateNormalCustomerMeal } from '@/domain/evaluation/normalCustomerMeal';
import type { TPopularTag } from '@/domain/trends/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import type { TTab } from '@/features/catalog/customers/shared/contracts';
import { applyTableSortChange } from '@/features/catalog/customers/shared/state/applyTableSortChange';
import { keepLastTag } from '@/features/catalog/customers/shared/state/keepLastTag';
import { reverseVisibilityState } from '@/features/catalog/customers/shared/state/tabVisibility';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { removeLastElement } from '@/shared/utilities/collections/removeLastElement';

import {
	type TCustomerNormalComputedMethods,
	type TCustomerNormalComputedStore,
} from './createComputedState';
import {
	type TBeverageTableSortDescriptor,
	type TRecipeTableSortDescriptor,
	type customerNormalInitialState,
	customerNormalCustomerInstance as instance_customer,
	customerNormalIngredientInstance as instance_ingredient,
	customerNormalRecipeInstance as instance_recipe,
} from './initialState';

export const createCustomerNormalStoreActions = (
	currentStore: TCustomerNormalComputedStore
) => ({
	onCustomerFilterBeverageTag(tag: TBeverageTag) {
		currentStore.shared.tab.set('beverage');
		currentStore.shared.beverage.table.page.set(1);
		currentStore.shared.customer.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.customer.select.beverageTag.set((prev) => {
			keepLastTag(prev, tag);
		});
	},
	onCustomerFilterRecipeTag(tag: TRecipeTag) {
		currentStore.shared.tab.set('recipe');
		currentStore.shared.recipe.table.page.set(1);
		currentStore.shared.customer.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.customer.select.recipeTag.set((prev) => {
			keepLastTag(prev, tag);
		});
	},
	onCustomerSelectedChange(customerName: TCustomerNormalName | null) {
		currentStore.shared.customer.name.set((prev) => {
			if (prev === null) {
				trackEvent(
					trackEvent.category.select,
					'Customer',
					customerName as TCustomerNormalName
				);
			} else if (customerName === null) {
				trackEvent(trackEvent.category.unselect, 'Customer', prev);
			} else {
				trackEvent(trackEvent.category.unselect, 'Customer', prev);
				trackEvent(
					trackEvent.category.select,
					'Customer',
					customerName
				);
			}
			return customerName;
		});
	},

	onBeverageTableAction(beverageName: TBeverageName) {
		currentStore.shared.beverage.name.set(beverageName);
		trackEvent(trackEvent.category.select, 'Beverage', beverageName);
	},
	onBeverageTablePageChange(page: number) {
		currentStore.shared.beverage.table.page.set(page);
	},
	onBeverageTableSearchValueChange(value: string) {
		currentStore.shared.beverage.searchValue.set(value);
		currentStore.shared.beverage.table.page.set(1);
	},
	onBeverageTableSelectedAvailabilityDlcsChange(dlcs: Selection) {
		currentStore.beverageTableAvailabilityDlcs.set(dlcs);
		currentStore.shared.beverage.table.page.set(1);
	},
	onBeverageTableSelectedTagsChange(tags: Selection) {
		currentStore.shared.customer.select.beverageTag.set(
			tags as SelectionSet
		);
		currentStore.shared.beverage.table.page.set(1);
	},
	onBeverageTableSortChange(config: TBeverageTableSortDescriptor) {
		currentStore.shared.beverage.table.page.set(1);
		const sortConfig = config as Required<TBeverageTableSortDescriptor>;
		currentStore.persistence.beverage.table.sortDescriptor.set(
			applyTableSortChange(
				sortConfig,
				currentStore.persistence.beverage.table.sortDescriptor.get()
			)
		);
	},

	onIngredientSelectedChange(ingredientName: TIngredientName) {
		const recipeData = currentStore.shared.recipe.data.get();
		if (recipeData === null) {
			return;
		}
		const recipeVariant = instance_recipe.getRecipeVariantById(
			recipeData.name,
			recipeData.recipeId
		);
		currentStore.shared.recipe.data.set((prev) => {
			if (
				prev !== null &&
				recipeVariant.ingredients.length +
					prev.extraIngredients.length <
					5
			) {
				prev.extraIngredients.push(ingredientName);
			}
		});
		trackEvent(trackEvent.category.select, 'Ingredient', ingredientName);
	},

	onRecipeTableAction(recipeName: TRecipeName, recipeId: number) {
		currentStore.shared.recipe.data.set({
			extraIngredients: [],
			name: recipeName,
			recipeId,
		});
		trackEvent(trackEvent.category.select, 'Recipe', recipeName);
	},
	onRecipeTablePageChange(page: number) {
		currentStore.shared.recipe.table.page.set(page);
	},
	onRecipeTableSearchValueChange(value: string) {
		currentStore.shared.recipe.searchValue.set(value);
		currentStore.shared.recipe.table.page.set(1);
	},
	onRecipeTableSelectedAvailabilityDlcsChange(dlcs: Selection) {
		currentStore.recipeTableAvailabilityDlcs.set(dlcs);
		currentStore.shared.recipe.table.page.set(1);
	},
	onRecipeTableSelectedCookersChange(cookers: Selection) {
		currentStore.recipeTableCookers.set(cookers);
		currentStore.shared.recipe.table.page.set(1);
	},
	onRecipeTableSelectedPositiveTagsChange(tags: Selection) {
		currentStore.shared.customer.select.recipeTag.set(tags as SelectionSet);
		currentStore.shared.recipe.table.page.set(1);
	},
	onRecipeTableSortChange(config: TRecipeTableSortDescriptor) {
		currentStore.shared.recipe.table.page.set(1);
		const sortConfig = config as Required<TRecipeTableSortDescriptor>;
		currentStore.persistence.recipe.table.sortDescriptor.set(
			applyTableSortChange(
				sortConfig,
				currentStore.persistence.recipe.table.sortDescriptor.get()
			)
		);
	},

	onTabSelectionChange(tab: Key) {
		currentStore.shared.tab.set(tab as TTab);
		currentStore.shared.customer.filterVisibility.set(tab === 'customer');
		currentStore.shared.ingredient.filterVisibility.set(
			tab === 'ingredient'
		);
	},

	evaluateMealResult() {
		const customerName = currentStore.shared.customer.name.get();
		if (customerName === null) {
			return;
		}
		const customerPositiveTags = instance_customer.getPropsByName(
			customerName,
			'positiveTags'
		);
		const customerPopularTrend =
			currentStore.shared.customer.popularTrend.get();
		const recipeData = currentStore.shared.recipe.data.get();
		const extraIngredients: TIngredientName[] =
			recipeData === null ? [] : recipeData.extraIngredients;
		const extraTags = extraIngredients.flatMap(
			(ingredient) =>
				instance_ingredient.getPropsByName(
					ingredient,
					'tags'
				) as TPopularTag[]
		);
		const recipe =
			recipeData === null
				? null
				: {
						...instance_recipe.getPropsByName(recipeData.name),
						ingredients: instance_recipe.getRecipeVariantById(
							recipeData.name,
							recipeData.recipeId
						).ingredients,
					};
		const isFamousShop = currentStore.shared.customer.famousShop.get();
		const rating = evaluateNormalCustomerMeal({
			currentCustomerName: customerName,
			currentCustomerPopularTrend: customerPopularTrend,
			currentCustomerPositiveTags: customerPositiveTags,
			currentExtraIngredientsLength: extraIngredients.length,
			currentExtraTags: extraTags,
			currentRecipe: recipe,
			isFamousShop,
		});
		currentStore.shared.customer.rating.set(rating);
	},
	removeMealIngredient(ingredientName: TIngredientName) {
		currentStore.shared.recipe.data.set((prev) => {
			if (prev !== null) {
				prev.extraIngredients = removeLastElement(
					prev.extraIngredients,
					ingredientName
				);
			}
		});
		trackEvent(trackEvent.category.unselect, 'Ingredient', ingredientName);
	},
	saveMealResult() {
		const customerName = currentStore.shared.customer.name.get();
		const beverageName = currentStore.shared.beverage.name.get();
		const recipeData = currentStore.shared.recipe.data.get();
		if (customerName === null || recipeData === null) {
			return;
		}
		const { extraIngredients, name: recipeName, recipeId } = recipeData;
		const saveObject = {
			beverage: beverageName,
			recipe: { extraIngredients, name: recipeName, recipeId },
		} as const;
		currentStore.persistence.meals.set((prev) => {
			(prev[customerName] ??= []).push(saveObject);
		});
		trackEvent(
			trackEvent.category.click,
			'Save Button',
			`${recipeName}${beverageName === null ? '' : ` - ${beverageName}`}${checkLengthEmpty(extraIngredients) ? '' : ` - ${extraIngredients.join(' ')}`}`
		);
	},

	refreshCustomer(name: TCustomerNormalName | null) {
		currentStore.shared.customer.name.set(name);
		currentStore.shared.tab.set('customer');
		currentStore.shared.customer.filterVisibility.set(true);
		currentStore.shared.recipe.searchValue.set('');
		currentStore.shared.beverage.searchValue.set('');
		currentStore.shared.ingredient.filterVisibility.set(false);
	},
	refreshCustomerSelectedItems() {
		currentStore.shared.customer.select.set({
			beverageTag: new Set(),
			recipeTag: new Set(),
		});
		currentStore.shared.customer.rating.set(null);
		currentStore.shared.recipe.data.set(null);
		currentStore.shared.recipe.table.page.set(1);
		currentStore.shared.beverage.name.set(null);
		currentStore.shared.beverage.table.page.set(1);
		currentStore.shared.ingredient.filterVisibility.set(false);
		if (currentStore.shared.tab.get() === 'ingredient') {
			if (currentStore.shared.customer.name.get() === null) {
				currentStore.shared.tab.set('customer');
			} else {
				currentStore.shared.tab.set('recipe');
			}
		}
	},
	toggleCustomerTabVisibilityState() {
		currentStore.persistence.customer.tabVisibility.set(
			reverseVisibilityState
		);
	},
	toggleIngredientTabVisibilityState() {
		currentStore.persistence.ingredient.tabVisibility.set(
			reverseVisibilityState
		);
	},
	updateRecipeTagsWithTrend() {
		const recipeData = currentStore.shared.recipe.data.get();
		if (recipeData === null) {
			currentStore.shared.recipe.tagsWithTrend.set([]);
		} else {
			const { extraIngredients, name, recipeId } = recipeData;
			const { positiveTags } = instance_recipe.getPropsByName(name);
			const { ingredients } = instance_recipe.getRecipeVariantById(
				name,
				recipeId
			);
			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				instance_ingredient.getPropsByName(extraIngredient, 'tags')
			);
			const popularTrend =
				currentStore.shared.customer.popularTrend.get();
			const isFamousShop = currentStore.shared.customer.famousShop.get();
			const composedRecipeTags =
				instance_recipe.composeTagsWithPopularTrend(
					ingredients,
					extraIngredients,
					positiveTags,
					extraTags,
					popularTrend
				);
			const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
				composedRecipeTags,
				popularTrend,
				isFamousShop
			);
			currentStore.shared.recipe.tagsWithTrend.set(recipeTagsWithTrend);
		}
	},
});

export type TCustomerNormalStoreActions = ReturnType<
	typeof createCustomerNormalStoreActions
>;

export type TCustomerNormalStore = StoreApi<
	typeof customerNormalInitialState,
	TCustomerNormalComputedMethods & TCustomerNormalStoreActions
>;
