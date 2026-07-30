import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import type {
	TIngredientName,
	TIngredientType,
	TIngredients,
} from '@/domain/data/ingredients/types';
import type { TLevel } from '@/domain/data/shared/types';
import type { TIngredientTag } from '@/domain/data/tags/types';
import { extractPlacesFromFoodFrom } from '@/domain/places/foodSources';
import type { IPopularTrend } from '@/domain/trends/types';

import { checkArrayEqualOf } from '@/shared/utilities/collections/check';
import { toSet } from '@/shared/utilities/collections/convert';

import { Food } from './Food';
import type { TProcessedIngredient } from './types';

export class Ingredient extends Food<TProcessedIngredient[]> {
	private static _instance: Ingredient | undefined;

	/** @description Flag to check if the types are consistent with the original data. */
	private static _isTypesChecked: boolean;
	private static _sortedTypes = [
		'海鲜',
		'肉类',
		'蔬菜',
		'其他',
	] as const satisfies TIngredientType[];

	private constructor(data: TIngredients) {
		const dataWithPlaces = data.map((item) => ({
			...item,
			places: extractPlacesFromFoodFrom(item.from),
		}));

		super(dataWithPlaces, 'ingredient');
	}

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
				'[domain/catalog/food/Ingredient]: the given types is inconsistent with the types in the original data'
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
}
