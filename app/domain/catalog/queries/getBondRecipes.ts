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
	const recipeCache = bondRecipesCache.getOrInsertComputed(
		recipes,
		() => new Map()
	);

	return recipeCache.getOrInsertComputed(customerName, () => {
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

		return bondRecipes;
	});
}
