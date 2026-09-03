import { type State } from '@davstack/store';
import { type Selection } from '@heroui/table';

import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type {
	TSpecialGuestId,
	TSpecialGuestName,
} from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { evaluateSpecialGuestMeal } from '@/domain/evaluation/specialGuestMeal';
import type { ISpecialGuestSavedMeal } from '@/domain/meals/types';

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
import { createSpecialGuestPlansActionsDefinition } from '@/features/specialGuestPlans/client/state/planStoreDefinition';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { removeLastElement } from '@/shared/utilities/collections/removeLastElement';

import {
	specialGuestBeverageCatalog as beverageCatalog,
	specialGuestFoodCatalog as foodCatalog,
	specialGuestIngredientCatalog as ingredientCatalog,
	specialGuestCatalog,
	type specialGuestInitialState,
} from './initialState';

type TSpecialGuestStoreActionContext = State<
	typeof specialGuestInitialState
> & {
	beverageTableAvailabilityDlcs: { set: (value: Selection) => void };
	foodTableAvailabilityDlcs: { set: (value: Selection) => void };
	foodTableCookerTypes: { set: (value: Selection) => void };
};

export const createSpecialGuestStoreActions = (
	currentStore: TSpecialGuestStoreActionContext
) => ({
	...createSpecialGuestPlansActionsDefinition(currentStore),
	onGuestFilterBeverageTag(tag: TBeverageTagId, hasMystiaCooker: boolean) {
		currentStore.shared.tab.set('beverage');
		currentStore.shared.beverage.table.page.set(1);
		currentStore.shared.guest.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.guest.select.beverageTag.set((prev) => {
			keepLastTag(prev, tag, {
				hasMystiaCooker,
				orderTag: currentStore.shared.guest.order.beverageTag.get(),
			});
		});
	},
	onGuestFilterFoodTag(tag: TFoodTagId, hasMystiaCooker: boolean) {
		currentStore.shared.tab.set('food');
		currentStore.shared.recipe.table.page.set(1);
		currentStore.shared.guest.filterVisibility.set(false);
		currentStore.shared.ingredient.filterVisibility.set(false);
		currentStore.shared.guest.select.foodTag.set((prev) => {
			keepLastTag(prev, tag, {
				hasMystiaCooker,
				orderTag: currentStore.shared.guest.order.foodTag.get(),
			});
		});
	},
	onGuestOrderBeverageTag(tag: TBeverageTagId) {
		currentStore.shared.guest.order.beverageTag.set((prev) => {
			const tagName = BEVERAGE_TAG_MAP[tag];
			if (prev === tag) {
				trackEvent(
					trackEvent.category.unselect,
					'Customer Tag',
					tagName
				);
				return null;
			}
			trackEvent(trackEvent.category.select, 'Customer Tag', tagName);
			return tag;
		});
	},
	onGuestOrderFoodTag(tag: TFoodTagId) {
		currentStore.shared.guest.order.foodTag.set((prev) => {
			const tagName = FOOD_TAG_MAP[tag];
			if (prev === tag) {
				trackEvent(
					trackEvent.category.unselect,
					'Customer Tag',
					tagName
				);
				return null;
			}
			trackEvent(trackEvent.category.select, 'Customer Tag', tagName);
			return tag;
		});
	},
	onGuestSelectedChange(specialGuest: TSpecialGuestId | null) {
		const guestName =
			specialGuest === null
				? null
				: specialGuestCatalog.getPropsById(specialGuest, 'name');
		currentStore.shared.guest.id.set((prev) => {
			const previousGuestName =
				prev === null
					? null
					: specialGuestCatalog.getPropsById(prev, 'name');
			if (prev === null) {
				trackEvent(
					trackEvent.category.select,
					'Customer',
					guestName as TSpecialGuestName
				);
			} else if (guestName === null) {
				trackEvent(
					trackEvent.category.unselect,
					'Customer',
					previousGuestName as TSpecialGuestName
				);
			} else {
				trackEvent(
					trackEvent.category.unselect,
					'Customer',
					previousGuestName as TSpecialGuestName
				);
				trackEvent(trackEvent.category.select, 'Customer', guestName);
			}
			return specialGuest;
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
		const currentSpecialGuest = currentStore.shared.guest.id.get();
		if (currentSpecialGuest === null) {
			return;
		}
		const guest = specialGuestCatalog.getPropsById(currentSpecialGuest);
		const guestOrder = currentStore.shared.guest.order.get();
		const hasMystiaCooker = currentStore.shared.guest.hasMystiaCooker.get();
		const isDarkMatter = Boolean(
			currentStore.shared.guest.isDarkMatter.get()
		);
		const beverage = currentStore.shared.beverage.id.get();
		const beverageTags: TBeverageTagId[] =
			beverage === null
				? []
				: beverageCatalog.getPropsById(beverage, 'tags');
		const mealFood = currentStore.shared.recipe.data.get();
		const foodTagsWithTrend =
			currentStore.shared.recipe.tagsWithTrend.get();
		const rating = evaluateSpecialGuestMeal({
			currentBeverageTags: beverageTags,
			currentFoodTagsWithTrend: foodTagsWithTrend,
			currentMealFood: mealFood,
			currentSpecialGuest: guest.id,
			currentSpecialGuestBeverageTags: guest.beverageTags,
			currentSpecialGuestNegativeTags: guest.negativeTags,
			currentSpecialGuestOrder: guestOrder,
			currentSpecialGuestPositiveTags: guest.positiveTags,
			hasMystiaCooker,
			isDarkMatter,
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
		const currentSpecialGuest = currentStore.shared.guest.id.get();
		const beverage = currentStore.shared.beverage.id.get();
		const mealFood = currentStore.shared.recipe.data.get();
		if (
			currentSpecialGuest === null ||
			beverage === null ||
			mealFood === null
		) {
			return;
		}
		const { extraIngredients, recipeId } = mealFood;
		const foodName = foodCatalog.getRecipeOwnerById(recipeId).food.name;
		const beverageName = beverageCatalog.getPropsById(beverage, 'name');
		const extraIngredientNames = extraIngredients.map((ingredient) =>
			ingredientCatalog.getPropsById(ingredient, 'name')
		);
		const guestOrder = currentStore.shared.guest.order.get();
		const hasMystiaCooker = currentStore.shared.guest.hasMystiaCooker.get();
		const isDarkMatter = currentStore.shared.guest.isDarkMatter.get();
		const saveObject: ISpecialGuestSavedMeal = {
			beverage,
			food: { extraIngredients: [...extraIngredients], recipeId },
			hasMystiaCooker,
			order:
				hasMystiaCooker && !isDarkMatter
					? { beverageTag: null, foodTag: null }
					: {
							beverageTag: guestOrder.beverageTag,
							foodTag: guestOrder.foodTag,
						},
		};
		currentStore.persistence.meals.set((prev) => {
			(prev[currentSpecialGuest] ??= []).push(saveObject);
		});
		trackEvent(
			trackEvent.category.click,
			'Save Button',
			`${foodName} - ${beverageName}${checkLengthEmpty(extraIngredientNames) ? '' : ` - ${extraIngredientNames.join(' ')}`}`
		);
	},

	refreshGuest(specialGuest: TSpecialGuestId | null) {
		currentStore.shared.guest.id.set(specialGuest);
		currentStore.shared.tab.set('guest');
		currentStore.shared.guest.filterVisibility.set(true);
		currentStore.shared.recipe.searchValue.set('');
		currentStore.shared.beverage.searchValue.set('');
		currentStore.shared.ingredient.filterVisibility.set(false);
	},
	refreshGuestSelectedItems() {
		currentStore.shared.guest.order.set({
			beverageTag: null,
			foodTag: null,
		});
		currentStore.shared.guest.select.set({
			beverageTag: new Set(),
			foodTag: new Set(),
		});
		currentStore.shared.guest.hasMystiaCooker.set(false);
		currentStore.shared.guest.isDarkMatter.set(null);
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
	toggleMystiaCooker() {
		const hasMystiaCooker = currentStore.shared.guest.hasMystiaCooker.get();
		currentStore.shared.guest.hasMystiaCooker.set(!hasMystiaCooker);
		const currentSpecialGuest = currentStore.shared.guest.id.get();
		trackEvent(
			hasMystiaCooker
				? trackEvent.category.unselect
				: trackEvent.category.select,
			'MystiaCooker',
			currentSpecialGuest === null
				? ''
				: specialGuestCatalog.getPropsById(currentSpecialGuest, 'name')
		);
	},
	updateFoodTagsWithTrend() {
		const mealFood = currentStore.shared.recipe.data.get();
		if (mealFood === null) {
			currentStore.shared.recipe.tagsWithTrend.set([]);
		} else {
			const { extraIngredients, recipeId } = mealFood;
			const { food, recipe } = foodCatalog.getRecipeOwnerById(recipeId);
			const extraTags = extraIngredients.flatMap((extraIngredient) =>
				ingredientCatalog.getIngredientTags(extraIngredient)
			);
			const popularTrend = currentStore.shared.guest.popularTrend.get();
			const isFamousShop = currentStore.shared.guest.famousShop.get();
			const composedFoodTags =
				foodCatalog.composeFoodTagsWithPopularTrend(
					recipe.ingredients,
					extraIngredients,
					food.positiveTags,
					extraTags,
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
