import {BEVERAGE_LIST, INGREDIENT_LIST, RECIPE_LIST} from '@/data';
import {Beverage, Ingredient, Recipe} from '@/utils';

export const beverageInstance = new Beverage(BEVERAGE_LIST);
export const ingredientInstance = new Ingredient(INGREDIENT_LIST);
export const recipeInstance = new Recipe(RECIPE_LIST);

export const foodInstances = {
	beverage: beverageInstance,
	ingredient: ingredientInstance,
	recipe: recipeInstance,
} as const;
