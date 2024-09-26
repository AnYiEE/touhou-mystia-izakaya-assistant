import {type DARK_MATTER_TAG, type TAG_ECONOMICAL, type TAG_EXPENSIVE, type TAG_LARGE_PARTITION} from '@/data/constant';
import type {TCookerNames} from '@/data/cookers/types';
import type {TCustomerRareNames} from '@/data/customer_rare/types';
import type {TIngredientNames} from '@/data/ingredients/types';
import type {IFoodBase} from '@/data/types';

export type TTagNeedCalculate = typeof TAG_ECONOMICAL | typeof TAG_EXPENSIVE;

type TTag =
	| '饱腹'
	| '不可思议'
	| '传说'
	| '毒'
	| '高级'
	| '果味'
	| '海味'
	| '和风'
	| '家常'
	| '菌类'
	| '辣'
	| '力量涌现'
	| '凉爽'
	| '猎奇'
	| '梦幻'
	| '清淡'
	| '燃起来了'
	| '肉'
	| '山珍'
	| '烧烤'
	| '生'
	| '适合拍照'
	| '水产'
	| '素'
	| '酸'
	| '汤羹'
	| '特产'
	| '甜'
	| '文化底蕴'
	| '西式'
	| '下酒'
	| '鲜'
	| '咸'
	| '小巧'
	| '招牌'
	| '中华'
	| '重油'
	| '灼热'
	| typeof TAG_LARGE_PARTITION
	| typeof DARK_MATTER_TAG;

export interface IRecipe extends IFoodBase {
	ingredients: TIngredientNames[];
	positiveTags: TTag[];
	negativeTags: TTag[];
	cooker: TCookerNames;
	max: number;
	min: number;
	from:
		| Partial<{
				bond: {
					name: TCustomerRareNames;
					level: number;
				};
				/** @description Recipes by levelup. */
				levelup: number;
				/** @description Initial recipes. */
				self: true;
		  }>
		| string;
}

export type TRecipes = typeof import('./data').RECIPE_LIST;

export type TRecipeNames = TRecipes[number]['name'];
