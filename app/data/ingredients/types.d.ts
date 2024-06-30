import type {IFoodBase} from '@/data/types';

type TTag =
	| '饱腹'
	| '不可思议'
	| '传说'
	| '毒'
	| '高级'
	| '果味'
	| '海味'
	| '家常'
	| '菌类'
	| '辣'
	| '凉爽'
	| '猎奇'
	| '梦幻'
	| '清淡'
	| '肉'
	| '山珍'
	| '生'
	| '适合拍照'
	| '水产'
	| '素'
	| '酸'
	| '甜'
	| '文化底蕴'
	| '西式'
	| '下酒'
	| '鲜'
	| '咸'
	| '小巧'
	| '招牌'
	| '重油';

type TType = '肉类' | '海鲜' | '蔬菜' | '其他';

export interface IIngredient extends IFoodBase {
	type: TType;
	tags: TTag[];
}

export type TIngredients = typeof import('./data').INGREDIENT_LIST;

export type TIngredientNames = TIngredients[number]['name'];
