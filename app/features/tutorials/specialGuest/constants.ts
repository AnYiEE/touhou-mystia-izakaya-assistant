import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

export const SPECIAL_GUEST_TUTORIAL_STORE_KEY = 'customer_rare_tutorial';
export const SPECIAL_GUEST_TUTORIAL_LOCAL_RESET_STORE_KEY =
	'customer_rare_tutorial_local_reset';
export const SPECIAL_GUEST_TUTORIAL_PATHNAME = '/special-guests';
export const SPECIAL_GUEST_TUTORIAL_START_DELAY_MS = 1000;
export const SPECIAL_GUEST_TUTORIAL_MOVE_DELAY_MS = 500;
export const SPECIAL_GUEST_TUTORIAL_SCROLL_MOVE_DELAY_MS = 1000;

export const SPECIAL_GUEST_TUTORIAL_GUEST_ID = 0;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID = 10;
export const SPECIAL_GUEST_TUTORIAL_RECIPE_ID = 24;
export const SPECIAL_GUEST_TUTORIAL_EGG_ID = 0;
export const SPECIAL_GUEST_TUTORIAL_HONEY_ID = 24;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID = 3 as TBeverageTagId;
export const SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID = 24 as TFoodTagId;

export const SPECIAL_GUEST_TUTORIAL_STEP_INDEX = {
	autoRecommendation: 4,
	beverage: 9,
	beverageTab: 7,
	beverageTag: 3,
	cooker: 14,
	food: 6,
	foodTab: 5,
	foodTag: 2,
	guest: 1,
	ingredient: 10,
	ingredient1: 11,
	ingredient2: 12,
	intro: 0,
	more: 16,
	rating: 13,
	save: 15,
	sort: 8,
} as const;

export const SPECIAL_GUEST_TUTORIAL_GUEST_POSITION = `[data-tutorial-guest="${SPECIAL_GUEST_TUTORIAL_GUEST_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION = `[data-tutorial-beverage-tag="${SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION =
	'[data-tutorial-beverage-table] [data-key="price"]';
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION = `[data-tutorial-beverage-table] tbody>tr[data-key="${SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID}"]>:last-child button`;
export const SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION = `[data-tutorial-food-tag="${SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION = `[data-tutorial-food-table] tbody>tr[data-key="${SPECIAL_GUEST_TUTORIAL_RECIPE_ID}"]>:last-child button`;
export const SPECIAL_GUEST_TUTORIAL_EGG_POSITION = `[data-tutorial-ingredient="${SPECIAL_GUEST_TUTORIAL_EGG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_HONEY_POSITION = `[data-tutorial-ingredient="${SPECIAL_GUEST_TUTORIAL_HONEY_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_SUGGESTED_MEALS_POSITION =
	'[data-tutorial-suggested-meals]';
export const SPECIAL_GUEST_TUTORIAL_FOOD_TAB_POSITION = '[data-key="food"]';
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAB_POSITION =
	'[data-key="beverage"]';
export const SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION =
	'[data-key="ingredient"]';
export const SPECIAL_GUEST_TUTORIAL_RATING_POSITION =
	'[data-tutorial-guest-rating]';
export const SPECIAL_GUEST_TUTORIAL_COOKER_POSITION =
	'[data-tutorial-mystia-cooker]';
export const SPECIAL_GUEST_TUTORIAL_SAVE_POSITION = '[data-tutorial-save-meal]';
export const SPECIAL_GUEST_TUTORIAL_MORE_POSITION =
	'[data-customer-info-entry]';
