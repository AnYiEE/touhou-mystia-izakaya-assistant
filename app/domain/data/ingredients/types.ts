export type TIngredients = typeof import('./records').INGREDIENT_LIST;
export type TIngredientName = TIngredients[number]['name'];
export type TIngredientType = TIngredients[number]['type'];
export type TIngredientTags = TIngredients[number]['tags'][number];
