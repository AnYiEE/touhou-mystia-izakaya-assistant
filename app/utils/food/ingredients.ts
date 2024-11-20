import {Food} from './base';
import {
	INGREDIENT_LIST,
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
	type TIngredientName,
	type TIngredientTag,
	type TIngredientType,
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

	public blockedIngredients: Set<TIngredientName> = new Set(['铃仙', '噗噗哟果', '强效辣椒素']);

	public blockedTags: Set<TIngredientTag> = new Set(['特产', '天罚']);

	/**
	 * @description Types sorted in the suggested order. Used for selecting ingredient types.
	 */
	public get sortedTypes() {
		const types = ['海鲜', '肉类', '蔬菜', '其他'] as const satisfies TIngredientType[];

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
	 * @description Calculate the tags based on the original tags and the popular tag data.
	 */
	public calculateTagsWithPopular(ingredientTags: ReadonlyArray<TIngredientTag>, popular: IPopularData) {
		const ingredientTagsWithPopular = [...ingredientTags];
		const {isNegative: isNegativePopularTag, tag: currentPopularTag} = popular;

		if (currentPopularTag && ingredientTags.includes(currentPopularTag as TIngredientTag)) {
			ingredientTagsWithPopular.push(isNegativePopularTag ? TAG_POPULAR_NEGATIVE : TAG_POPULAR_POSITIVE);
		}

		return ingredientTagsWithPopular;
	}
}
