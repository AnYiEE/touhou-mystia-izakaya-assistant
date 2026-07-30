import { isObject } from 'lodash';

import type { TRecipe } from '@/domain/catalog/food/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TRecipeName } from '@/domain/data/recipes/types';

import { numberSort } from '@/shared/utilities/sort/numberSort';

type TBondRecipes = Array<{ level: number; name: TRecipeName }>;

const bondRecipesCache = new WeakMap<
	ReadonlyArray<TRecipe>,
	Map<TCustomerRareName, TBondRecipes>
>();

export function getBondRecipes(
	customerName: TCustomerRareName,
	recipes: ReadonlyArray<TRecipe>
) {
	let recipeCache = bondRecipesCache.get(recipes);
	if (recipeCache === undefined) {
		recipeCache = new Map();
		bondRecipesCache.set(recipes, recipeCache);
	}

	if (recipeCache.has(customerName)) {
		return recipeCache.get(customerName);
	}

	const bondRecipes: TBondRecipes = [];

	recipes.forEach(({ from, name }) => {
		if (
			isObject(from) &&
			'bond' in from &&
			from.bond.name === customerName
		) {
			bondRecipes.push({ level: from.bond.level, name });
		}
	});

	bondRecipes.sort(({ level: a }, { level: b }) => numberSort(a, b));

	recipeCache.set(customerName, bondRecipes);

	return bondRecipes;
}
