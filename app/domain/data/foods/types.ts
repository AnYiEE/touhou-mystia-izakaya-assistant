export type TFoods = typeof import('./records').FOOD_LIST;
export type TFoodId = TFoods[number]['id'];
export type TFoodName = TFoods[number]['name'];
export type TRecipeId = TFoods[number]['recipes'][number]['id'];
