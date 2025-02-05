import {type DYNAMIC_TAG_MAP} from '@/data/constant';
import type {IFoodBase} from '@/data/types';

type TTag =
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
	| '西式'
	| '咸'
	| '鲜'
	| '甜'
	| '生'
	| (typeof DYNAMIC_TAG_MAP)['signature']
	| '适合拍照'
	| '凉爽'
	| '猎奇'
	| '文化底蕴'
	| '菌类'
	| '不可思议'
	| '小巧'
	| '梦幻'
	| '特产'
	| '果味'
	| '辣'
	| '酸'
	| '毒'
	| '天罚';

type TType = '肉类' | '海鲜' | '蔬菜' | '其他';

export interface IIngredient extends IFoodBase {
	type: TType;
	tags: TTag[];
}

export type TIngredients = typeof import('./data').INGREDIENT_LIST;

export type TIngredientName = TIngredients[number]['name'];
export type TIngredientType = TIngredients[number]['type'];
