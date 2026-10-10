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

export const SPECIAL_GUEST_TUTORIAL_GUEST_POSITION = `[data-tutorial-guest="${SPECIAL_GUEST_TUTORIAL_GUEST_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_POSITION = `[data-tutorial-beverage-tag="${SPECIAL_GUEST_TUTORIAL_BEVERAGE_TAG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_SORT_POSITION =
	'[data-tutorial-beverage-table] [data-key="price"]';
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_POSITION = `[data-tutorial-beverage-table] tbody>tr[data-key="${SPECIAL_GUEST_TUTORIAL_BEVERAGE_ID}"]>:last-child button`;
export const SPECIAL_GUEST_TUTORIAL_BEVERAGE_STEP_INDEX = 4;
export const SPECIAL_GUEST_TUTORIAL_FOOD_TAG_POSITION = `[data-tutorial-food-tag="${SPECIAL_GUEST_TUTORIAL_FOOD_TAG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_RECIPE_POSITION = `[data-tutorial-food-table] tbody>tr[data-key="${SPECIAL_GUEST_TUTORIAL_RECIPE_ID}"]>:last-child button`;
export const SPECIAL_GUEST_TUTORIAL_EGG_POSITION = `[data-tutorial-ingredient="${SPECIAL_GUEST_TUTORIAL_EGG_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_HONEY_POSITION = `[data-tutorial-ingredient="${SPECIAL_GUEST_TUTORIAL_HONEY_ID}"]`;
export const SPECIAL_GUEST_TUTORIAL_INGREDIENT_TAB_POSITION =
	'[data-key="ingredient"]';
