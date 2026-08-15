import { type BEVERAGE_TAG_MAP, type FOOD_TAG_MAP } from './tagFacts';

export type TBeverageTagId = keyof typeof BEVERAGE_TAG_MAP;
export type TFoodTagId = keyof typeof FOOD_TAG_MAP;

export type TBeverageTagLabel = (typeof BEVERAGE_TAG_MAP)[TBeverageTagId];
export type TFoodTagLabel = (typeof FOOD_TAG_MAP)[TFoodTagId];
