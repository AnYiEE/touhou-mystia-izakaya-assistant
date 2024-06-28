import type {TBusinessman, TCollectionLocation, TTask, IFoodBase} from '@/data/types';

type TTag =
	| '低酒精'
	| '中酒精'
	| '高酒精'
	| '无酒精'
	| '鸡尾酒'
	| '利口酒'
	| '啤酒'
	| '清酒'
	| '烧酒'
	| '西洋酒'
	| '可加冰'
	| '可加热'
	| '甘'
	| '苦'
	| '辛'
	| '古典'
	| '现代'
	| '气泡'
	| '水果'
	| '提神'
	| '直饮';

type TFromBase = IFoodBase['from'];

interface IFrom extends TFromBase {
	/** @description 初始拥有的饮品 */
	self: boolean;
}

export interface IBeverage extends IFoodBase {
	tags: TTag[];
	from: Partial<IFrom>;
}

export type TBeverages = typeof import('./data').BEVERAGE_LIST;

export type TBeverageNames = TBeverages[number]['name'];
