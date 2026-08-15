export type TIngredients = typeof import('./records').INGREDIENT_LIST;
export type TIngredientId = TIngredients[number]['id'];
export type TIngredientName = TIngredients[number]['name'];
export type TIngredientTypeId = TIngredients[number]['type'];
export type TIngredientTypeLabel =
	(typeof import('./ingredientFacts').INGREDIENT_TYPE_MAP)[TIngredientTypeId];
