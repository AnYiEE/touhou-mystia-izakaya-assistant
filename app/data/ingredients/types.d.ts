import type {Businessman, CollectionLocation, Task, IFoodBase} from '@/data/types';

type Tag =
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

type Type = '肉类' | '海鲜' | '蔬菜' | '其他';

export interface IIngredient extends IFoodBase {
	type: Type;
	tag: Tag[];
}

export type Ingredients = typeof import('./data').INGREDIENT_LIST;

export type IngredientNames = Ingredients[number]['name'];
