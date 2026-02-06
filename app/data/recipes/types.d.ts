import {
	type TCookerName,
	type TCurrencyName,
	type TCustomerRareName,
	type TIngredientName,
	type TPlace,
} from '@/data';
import {
	type DARK_MATTER_META_MAP,
	type DYNAMIC_TAG_MAP,
} from '@/data/constant';
import type { IFoodBase, TMerchant } from '@/data/types';

type TTag =
	| (typeof DARK_MATTER_META_MAP)['positiveTag']
	| (typeof DYNAMIC_TAG_MAP)['economical']
	| (typeof DYNAMIC_TAG_MAP)['largePartition']
	| '肉'
	| '水产'
	| '素'
	| '家常'
	| '高级'
	| '传说'
	| '重油'
	| '清淡'
	| '下酒'
	| '饱腹'
	| '山珍'
	| '海味'
	| '和风'
	| '西式'
	| '中华'
	| '咸'
	| '鲜'
	| '甜'
	| '生'
	| (typeof DYNAMIC_TAG_MAP)['signature']
	| '适合拍照'
	| '凉爽'
	| '灼热'
	| '力量涌现'
	| '猎奇'
	| '文化底蕴'
	| '菌类'
	| '不可思议'
	| '小巧'
	| '梦幻'
	| '特产'
	| '果味'
	| '汤羹'
	| '烧烤'
	| '辣'
	| '燃起来了'
	| '酸'
	| '毒';

export interface IRecipe extends IFoodBase {
	/** @description If the value is `-1`, it means there is no corresponding recipe. */
	recipeId: number;
	ingredients: TIngredientName[];
	positiveTags: TTag[];
	negativeTags: TTag[];
	cooker: TCookerName;
	baseCookTime: number;
	from:
		| string
		| Partial<{
				bond: { name: TCustomerRareName; level: number };
				buy: {
					name: TMerchant;
					price: { currency: TCurrencyName; amount: number };
				};
				/** @description Recipes by levelup. */
				levelup: [number, TPlace | null];
				/** @description Initial recipes. */
				self: true;
		  }>;
}

export type TRecipes = typeof import('./data').RECIPE_LIST;

export type TRecipeName = TRecipes[number]['name'];
