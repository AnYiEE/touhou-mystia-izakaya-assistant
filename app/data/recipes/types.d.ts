import type {IFoodBase} from '@/data/types';
import type {TCookerNames} from '../cookers/types';
import type {TCustomerRareNames} from '../customer_rare/types';
import type {TIngredientNames} from '../ingredients/types';

export type TTagNeedCalculate = '昂贵' | '实惠';

type TTag =
	| '饱腹'
	| '不可思议'
	| '传说'
	| '大份'
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
	| '灼热';

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
				/** @description 初始拥有的菜品 */
				self: true;
				/** @description 升级拥有的菜品 */
				levelup: true;
		  }>
		| string;
}

export type TRecipes = typeof import('./data').RECIPE_LIST;

export type TRecipeNames = TRecipes[number]['name'];
