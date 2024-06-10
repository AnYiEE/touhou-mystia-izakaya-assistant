import {BEVERAGE_LIST, INGREDIENT_LIST, RECIPE_LIST} from '@/data';

import {Beverage, Ingredient, Recipe} from '@/utils';

const beverageInstance = new Beverage(BEVERAGE_LIST);
const ingredientInstance = new Ingredient(INGREDIENT_LIST);
const recipeInstance = new Recipe(RECIPE_LIST);

const foodInstances = {
	beverage: beverageInstance,
	ingredient: ingredientInstance,
	recipe: recipeInstance,
} as const;

export {foodInstances};
