import { Food } from './base';
import {
	INGREDIENT_LIST,
	type TIngredientName,
	type TIngredientTag,
	type TIngredientType,
	type TIngredients,
	type TLevel,
} from '@/data';
import { Recipe } from '@/utils';
import type { TRecipe } from '@/utils/types';

import { checkArrayEqualOf, toSet } from '@/utilities';
import type { IPopularTrend } from '@/types';

export class Ingredient extends Food<TIngredients> {
	private static _instance: Ingredient | undefined;

	/** @description Flag to check if the types are consistent with the original data. */
	private static _isTypesChecked: boolean;
	private static _sortedTypes = [
		'海鲜',
		'肉类',
		'蔬菜',
		'其他',
	] as const satisfies TIngredientType[];

	private static _relatedRecipesCache = new Map<TIngredientName, TRecipe[]>();

	public static getInstance() {
		if (Ingredient._instance !== undefined) {
			return Ingredient._instance;
		}

		const instance = new Ingredient(INGREDIENT_LIST);

		Ingredient._instance = instance;

		return instance;
	}

	public blockedLevels = toSet(10) as Set<TLevel>;
	public blockedIngredients = toSet(
		'铃仙',
		'噗噗哟果',
		'强效辣椒素'
	) as Set<TIngredientName>;
	public blockedTags = toSet('特产', '天罚') as Set<TIngredientTag>;

	/**
	 * @description Types sorted in the suggested order. Used for selecting ingredient types.
	 */
	public get sortedTypes() {
		if (Ingredient._isTypesChecked) {
			return Ingredient._sortedTypes;
		}

		const isTypesEqual = checkArrayEqualOf(
			Ingredient._sortedTypes,
			this.getValuesByProp('type')
		);
		if (!isTypesEqual) {
			throw new Error(
				'[utils/food/Ingredient]: the given types is inconsistent with the types in the original data'
			);
		}

		Ingredient._isTypesChecked = true;

		return Ingredient._sortedTypes;
	}

	/**
	 * @description Calculate the tags based on the original tags, the popular trend data and the famous shop state.
	 */
	public override calculateTagsWithTrend(
		ingredientTags: ReadonlyArray<TIngredientTag>,
		popularTrend: IPopularTrend,
		isFamousShop: boolean
	) {
		return super.calculateTagsWithTrend(
			ingredientTags,
			popularTrend,
			isFamousShop
		) as TIngredientTag[];
	}

	/**
	 * @description Get the recipes related to the ingredient.
	 */
	public getRelatedRecipes(ingredientName: TIngredientName) {
		if (Ingredient._relatedRecipesCache.has(ingredientName)) {
			return Ingredient._relatedRecipesCache.get(ingredientName);
		}

		const relatedRecipes: TRecipe[] = [];

		Recipe.getInstance()
			.getPinyinSortedData()
			.get()
			.forEach((recipe) => {
				if (
					(recipe.ingredients as TIngredientName[]).includes(
						ingredientName
					)
				) {
					relatedRecipes.push(recipe);
				}
			});

		Ingredient._relatedRecipesCache.set(ingredientName, relatedRecipes);

		return relatedRecipes;
	}
}
