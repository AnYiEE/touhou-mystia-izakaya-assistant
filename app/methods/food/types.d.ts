import {type foodInstances, type beverageInstance, type ingredientInstance, type recipeInstance} from './index';

export type TBeverageInstance = typeof beverageInstance;
export type TIngredientInstance = typeof ingredientInstance;
export type TRecipeInstance = typeof recipeInstance;

export type TFoodInstances = (typeof foodInstances)[keyof typeof foodInstances];
