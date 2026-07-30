export type TRecipes = typeof import('./records').RECIPE_LIST;
export type TRecipeName = TRecipes[number]['name'];
export type TRecipeTags =
	| TRecipes[number]['positiveTags'][number]
	| TRecipes[number]['negativeTags'][number];
