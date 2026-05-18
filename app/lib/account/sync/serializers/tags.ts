import { DYNAMIC_TAG_MAP, type TBeverageTag, type TRecipeTag } from '@/data';
import { Beverage, Recipe } from '@/utils';

const beverageTagSet = new Set<string>(
	Beverage.getInstance().getValuesByProp('tags')
);
const recipeTagSet = new Set<string>([
	...Recipe.getInstance().getValuesByProp(['positiveTags', 'negativeTags']),
	...Object.values(DYNAMIC_TAG_MAP),
]);

export function checkBeverageTag(data: unknown): data is TBeverageTag {
	return typeof data === 'string' && beverageTagSet.has(data);
}

export function checkRecipeTag(data: unknown): data is TRecipeTag {
	return typeof data === 'string' && recipeTagSet.has(data);
}
