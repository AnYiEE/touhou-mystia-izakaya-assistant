import { DYNAMIC_TAG_MAP, type TBeverageTag, type TRecipeTag } from '@/data';
import { type TPopularTag } from '@/types';
import { Beverage, Ingredient, Recipe } from '@/utils';

const beverageTagSet = new Set<string>(
	Beverage.getInstance().getValuesByProp('tags')
);
const ingredientInstance = Ingredient.getInstance();
const recipeInstance = Recipe.getInstance();
const recipeTagSet = new Set<string>([
	...recipeInstance.getValuesByProp(['positiveTags', 'negativeTags']),
	...Object.values(DYNAMIC_TAG_MAP),
]);
const popularTagSet = new Set<string>([
	...ingredientInstance
		.getValuesByProp('tags')
		.filter((tag) => !ingredientInstance.blockedTags.has(tag)),
	...recipeInstance
		.getValuesByProp('positiveTags')
		.filter((tag) => !recipeInstance.blockedTags.has(tag)),
]);

export function checkBeverageTag(data: unknown): data is TBeverageTag {
	return typeof data === 'string' && beverageTagSet.has(data);
}

export function checkRecipeTag(data: unknown): data is TRecipeTag {
	return typeof data === 'string' && recipeTagSet.has(data);
}

export function checkPopularTag(data: unknown): data is TPopularTag {
	return typeof data === 'string' && popularTagSet.has(data);
}
