import {Food} from './base';
import {
	INGREDIENT_LIST,
	type TIngredientId,
	type TIngredientTagId,
	type TIngredientTypeId,
	type TIngredients,
	type TLevel,
} from '@/data';
import {type IPopularData} from '@/stores';
import {checkArrayEqualOf} from '@/utils';

export class Ingredient extends Food<TIngredients> {
	private static _instance: Ingredient | undefined;

	/** @description Flag to check if the types are consistent with the original data. */
	private static _isTypesChecked: boolean;

	public static getInstance() {
		if (Ingredient._instance !== undefined) {
			return Ingredient._instance;
		}

		const instance = new Ingredient(INGREDIENT_LIST);

		Ingredient._instance = instance;

		return instance;
	}

	public blockedLevels: Set<TLevel> = new Set([10]);

	public blockedIngredients: Set<TIngredientId> = new Set([-1, 5002, 5005]);

	public blockedTags: Set<TIngredientTagId> = new Set([30, 5000]);

	/**
	 * @description Types sorted in the suggested order. Used for selecting ingredient types.
	 */
	public get sortedTypes() {
		const types = [1, 0, 2, -1] as const satisfies TIngredientTypeId[];

		if (Ingredient._isTypesChecked) {
			return types;
		}

		const isTypesEqual = checkArrayEqualOf(types, this.getValuesByProp(this.data, 'type'));
		if (!isTypesEqual) {
			throw new Error(
				'[utils/food/Ingredient]: the given types is inconsistent with the types in the original data'
			);
		}

		Ingredient._isTypesChecked = true;

		return types;
	}

	/**
	 * @description Calculate the tags based on the original tags, the popular tag data and the famous shop state.
	 */
	public calculateTagsWithPopular(
		ingredientTags: ReadonlyArray<TIngredientTagId>,
		popular: IPopularData,
		isFamousShop: boolean
	) {
		const ingredientTagsWithPopular = new Set(ingredientTags);
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (isFamousShop && ingredientTags.includes(19)) {
			ingredientTagsWithPopular.add(-20);
		}

		if (currentPopularTag !== null && ingredientTags.includes(currentPopularTag)) {
			ingredientTagsWithPopular.add(isNegativePopularTag ? -21 : -20);
		}

		return [...ingredientTagsWithPopular];
	}
}
