import { type StoreApi } from '@davstack/store';
import { type Selection } from '@heroui/table';

import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type {
	TNormalGuestId,
	TNormalGuestName,
} from '@/domain/data/guests/normal/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { evaluateNormalGuestMeal } from '@/domain/evaluation/normalGuestMeal';
import type { INormalGuestSavedMeal } from '@/domain/meals/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import type { TTab } from '@/features/catalog/guests/shared/contracts';
import { applyTableSortChange } from '@/features/catalog/guests/shared/state/applyTableSortChange';
import type {
	TBeverageTableSortDescriptor,
	TFoodTableSortDescriptor,
} from '@/features/catalog/guests/shared/state/guestPersistenceShape';
import { keepLastTag } from '@/features/catalog/guests/shared/state/keepLastTag';
import { reverseVisibilityState } from '@/features/catalog/guests/shared/state/tabVisibility';
import {
	beverageTagSelectionAdapter,
	foodTagSelectionAdapter,
} from '@/features/catalog/guests/shared/state/tagSelectionAdapter';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { removeLastElement } from '@/shared/utilities/collections/removeLastElement';

import {
	type TNormalGuestComputedMethods,
	type TNormalGuestComputedStore,
} from './createComputedState';
import {
	normalGuestBeverageCatalog as beverageCatalog,
	normalGuestFoodCatalog as foodCatalog,
	normalGuestIngredientCatalog as ingredientCatalog,
	normalGuestCatalog,
	type normalGuestInitialState,
} from './initialState';

export const createNormalGuestStoreActions = (
	currentStore: TNormalGuestComputedStore
) => ({
	onGuestFilterBeverageTag(beverageTag: TBeverageTagId) {
		currentStore.shared.tab.set('beverage');
		currentStore.shared.beverage.table.page.set(1);
		currentStore.shared.guest.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.guest.select.beverageTag.set((prev) => {
			keepLastTag(prev, beverageTag);
		});
	},
	onGuestFilterFoodTag(foodTag: TFoodTagId) {
		currentStore.shared.tab.set('food');
		currentStore.shared.recipe.table.page.set(1);
		currentStore.shared.guest.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.guest.select.foodTag.set((prev) => {
			keepLastTag(prev, foodTag);
		});
	},
	onGuestSelectedChange(normalGuest: TNormalGuestId | null) {
		const normalGuestName =
			normalGuest === null
				? null
				: normalGuestCatalog.getPropsById(normalGuest, 'name');
		currentStore.shared.guest.id.set((prev) => {
			if (prev === null) {
				trackEvent(
					trackEvent.category.select,
					'Customer',
					normalGuestName as TNormalGuestName
				);
			} else if (normalGuest === null) {
				trackEvent(
					trackEvent.category.unselect,
					'Customer',
					normalGuestCatalog.getPropsById(prev, 'name')
				);
			} else {
				trackEvent(
					trackEvent.category.unselect,
					'Customer',
					normalGuestCatalog.getPropsById(prev, 'name')
				);
				trackEvent(
					trackEvent.category.select,
					'Customer',
					normalGuestCatalog.getPropsById(normalGuest, 'name')
				);
			}
			return normalGuest;
		});
	},

	onBeverageTableAction(beverage: TBeverageId) {
		const beverageName = beverageCatalog.getPropsById(beverage, 'name');
		currentStore.shared.beverage.id.set(beverage);
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
		currentStore.shared.guest.select.beverageTag.set(
			beverageTagSelectionAdapter.fromSelection(tags)
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

	onIngredientSelectedChange(ingredient: TIngredientId) {
		const mealFood = currentStore.shared.recipe.data.get();
		if (mealFood === null) {
			return;
		}
		const { recipe } = foodCatalog.getRecipeOwnerById(mealFood.recipeId);
		currentStore.shared.recipe.data.set((prev) => {
			if (
				prev !== null &&
				recipe.ingredients.length + prev.extraIngredients.length < 5
			) {
				prev.extraIngredients.push(ingredient);
			}
		});
		const ingredientName = ingredientCatalog.getPropsById(
			ingredient,
			'name'
		);
		trackEvent(trackEvent.category.select, 'Ingredient', ingredientName);
	},

	onFoodTableAction(food: TFoodId, recipe: TRecipeId) {
		const foodName = foodCatalog.getPropsById(food, 'name');
		currentStore.shared.recipe.data.set({
			extraIngredients: [],
			recipeId: recipe,
		});
		trackEvent(trackEvent.category.select, 'Recipe', foodName);
	},
	onFoodTablePageChange(page: number) {
		currentStore.shared.recipe.table.page.set(page);
	},
	onFoodTableSearchValueChange(value: string) {
		currentStore.shared.recipe.searchValue.set(value);
		currentStore.shared.recipe.table.page.set(1);
	},
	onFoodTableSelectedAvailabilityDlcsChange(dlcs: Selection) {
		currentStore.foodTableAvailabilityDlcs.set(dlcs);
		currentStore.shared.recipe.table.page.set(1);
	},
	onFoodTableSelectedCookerTypesChange(cookerTypes: Selection) {
		currentStore.foodTableCookerTypes.set(cookerTypes);
		currentStore.shared.recipe.table.page.set(1);
	},
	onFoodTableSelectedPositiveTagsChange(tags: Selection) {
		currentStore.shared.guest.select.foodTag.set(
			foodTagSelectionAdapter.fromSelection(tags)
		);
		currentStore.shared.recipe.table.page.set(1);
	},
	onFoodTableSortChange(config: TFoodTableSortDescriptor) {
		currentStore.shared.recipe.table.page.set(1);
		const sortConfig = config as Required<TFoodTableSortDescriptor>;
		currentStore.persistence.recipe.table.sortDescriptor.set(
			applyTableSortChange(
				sortConfig,
				currentStore.persistence.recipe.table.sortDescriptor.get()
			)
		);
	},

	onTabSelectionChange(tab: TTab) {
		currentStore.shared.tab.set(tab);
		currentStore.shared.guest.filterVisibility.set(tab === 'guest');
		currentStore.shared.ingredient.filterVisibility.set(
			tab === 'ingredient'
		);
	},

	evaluateMealResult() {
		const normalGuest = currentStore.shared.guest.id.get();
		if (normalGuest === null) {
			return;
		}
		const normalGuestPositiveTags = normalGuestCatalog.getPropsById(
			normalGuest,
			'positiveTags'
		);
		const mealFoodData = currentStore.shared.recipe.data.get();
		const foodTagsWithTrend =
			currentStore.shared.recipe.tagsWithTrend.get();
		const rating = evaluateNormalGuestMeal({
			currentFoodTagsWithTrend: foodTagsWithTrend,
			currentMealFood: mealFoodData,
			currentNormalGuest: normalGuest,
			currentNormalGuestPositiveTags: normalGuestPositiveTags,
		});
		currentStore.shared.guest.rating.set(rating);
	},
	removeMealIngredient(ingredient: TIngredientId) {
		currentStore.shared.recipe.data.set((prev) => {
			if (prev !== null) {
				prev.extraIngredients = removeLastElement(
					prev.extraIngredients,
					ingredient
				);
			}
		});
		const ingredientName = ingredientCatalog.getPropsById(
			ingredient,
			'name'
		);
		trackEvent(trackEvent.category.unselect, 'Ingredient', ingredientName);
	},
	saveMealResult() {
		const normalGuest = currentStore.shared.guest.id.get();
		const beverage = currentStore.shared.beverage.id.get();
		const mealFoodData = currentStore.shared.recipe.data.get();
		if (normalGuest === null || mealFoodData === null) {
			return;
		}
		const { extraIngredients, recipeId } = mealFoodData;
		const foodName = foodCatalog.getRecipeOwnerById(recipeId).food.name;
		const beverageName =
			beverage === null
				? null
				: beverageCatalog.getPropsById(beverage, 'name');
		const extraIngredientNames = extraIngredients.map((ingredient) =>
			ingredientCatalog.getPropsById(ingredient, 'name')
		);
		const saveObject: INormalGuestSavedMeal = {
			beverage,
			food: { extraIngredients: [...extraIngredients], recipeId },
		};
		currentStore.persistence.meals.set((prev) => {
			(prev[normalGuest] ??= []).push(saveObject);
		});
		trackEvent(
			trackEvent.category.click,
			'Save Button',
			`${foodName}${beverageName === null ? '' : ` - ${beverageName}`}${checkLengthEmpty(extraIngredientNames) ? '' : ` - ${extraIngredientNames.join(' ')}`}`
		);
	},

	refreshGuest(normalGuest: TNormalGuestId | null) {
		currentStore.shared.guest.id.set(normalGuest);
		currentStore.shared.tab.set('guest');
		currentStore.shared.guest.filterVisibility.set(true);
		currentStore.shared.recipe.searchValue.set('');
		currentStore.shared.beverage.searchValue.set('');
		currentStore.shared.ingredient.filterVisibility.set(false);
	},
	refreshGuestSelectedItems() {
		currentStore.shared.guest.select.set({
			beverageTag: new Set(),
			foodTag: new Set(),
		});
		currentStore.shared.guest.rating.set(null);
		currentStore.shared.recipe.data.set(null);
		currentStore.shared.recipe.table.page.set(1);
		currentStore.shared.beverage.id.set(null);
		currentStore.shared.beverage.table.page.set(1);
		currentStore.shared.ingredient.filterVisibility.set(false);
		if (currentStore.shared.tab.get() === 'ingredient') {
			if (currentStore.shared.guest.id.get() === null) {
				currentStore.shared.tab.set('guest');
			} else {
				currentStore.shared.tab.set('food');
			}
		}
	},
	toggleGuestTabVisibilityState() {
		currentStore.persistence.guest.tabVisibility.set(
			reverseVisibilityState
		);
	},
	toggleIngredientTabVisibilityState() {
		currentStore.persistence.ingredient.tabVisibility.set(
			reverseVisibilityState
		);
	},
	updateFoodTagsWithTrend() {
		const mealFoodData = currentStore.shared.recipe.data.get();
		if (mealFoodData === null) {
			currentStore.shared.recipe.tagsWithTrend.set([]);
		} else {
			const { extraIngredients, recipeId } = mealFoodData;
			const { food, recipe } = foodCatalog.getRecipeOwnerById(recipeId);
			const extraIngredientTags = extraIngredients.flatMap((ingredient) =>
				ingredientCatalog.getIngredientTags(ingredient)
			);
			const popularTrend = currentStore.shared.guest.popularTrend.get();
			const isFamousShop = currentStore.shared.guest.famousShop.get();
			const composedFoodTags =
				foodCatalog.composeFoodTagsWithPopularTrend(
					recipe.ingredients,
					extraIngredients,
					food.positiveTags,
					extraIngredientTags,
					popularTrend
				);
			const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
				composedFoodTags,
				popularTrend,
				isFamousShop
			);
			currentStore.shared.recipe.tagsWithTrend.set(foodTagsWithTrend);
		}
	},
});

export type TNormalGuestStoreActions = ReturnType<
	typeof createNormalGuestStoreActions
>;

export type TNormalGuestStore = StoreApi<
	typeof normalGuestInitialState,
	TNormalGuestComputedMethods & TNormalGuestStoreActions
>;
