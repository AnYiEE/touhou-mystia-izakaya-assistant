import {
	type DARK_MATTER_TAG,
	type TAG_ECONOMICAL,
	type TAG_EXPENSIVE,
	type TAG_LARGE_PARTITION,
	type TCookerNames,
	type TCurrencyNames,
	type TCustomerRareNames,
	type TIngredientNames,
} from '@/data';
import type {IFoodBase, TMerchant, TPlace} from '@/data/types';

export type TTagNeedCalculate = typeof TAG_EXPENSIVE | typeof TAG_ECONOMICAL;

type TTag =
	| typeof DARK_MATTER_TAG
	| typeof TAG_LARGE_PARTITION
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
	| '招牌'
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
	ingredients: TIngredientNames[];
	positiveTags: TTag[];
	negativeTags: TTag[];
	cooker: TCookerNames;
	max: number;
	min: number;
	from:
		| string
		| Partial<{
				bond: {
					name: TCustomerRareNames;
					level: number;
				};
				buy: {
					name: TMerchant;
					price: {
						currency: TCurrencyNames;
						amount: number;
					};
				};
				/** @description Recipes by levelup. */
				levelup: [number, TPlace | null];
				/** @description Initial recipes. */
				self: true;
		  }>;
}

export type TRecipes = typeof import('./data').RECIPE_LIST;

export type TRecipeNames = TRecipes[number]['name'];
