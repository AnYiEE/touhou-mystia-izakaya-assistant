import {BEVERAGE_LIST, INGREDIENT_LIST, RECIPES_LIST} from '@/data';

import {Beverage, Ingredient, Recipe} from '@/utils';

const beverageInstance = new Beverage(BEVERAGE_LIST);
const ingredientInstance = new Ingredient(INGREDIENT_LIST);
const recipeInstance = new Recipe(RECIPES_LIST);

export {beverageInstance, ingredientInstance, recipeInstance};
