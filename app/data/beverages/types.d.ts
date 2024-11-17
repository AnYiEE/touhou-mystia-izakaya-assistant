import type {IFoodBase} from '@/data/types';

type TTag =
	| '无酒精'
	| '低酒精'
	| '中酒精'
	| '高酒精'
	| '可加冰'
	| '可加热'
	| '烧酒'
	| '清酒'
	| '鸡尾酒'
	| '西洋酒'
	| '利口酒'
	| '啤酒'
	| '直饮'
	| '水果'
	| '甘'
	| '辛'
	| '苦'
	| '气泡'
	| '古典'
	| '现代'
	| '提神';

type TFromBase = IFoodBase['from'];

interface IFrom extends Omit<TFromBase, 'fishing'> {
	/** @description Initial beverages. */
	self: boolean;
}

export interface IBeverage extends IFoodBase {
	tags: TTag[];
	from: Partial<IFrom>;
}

export type TBeverages = typeof import('./data').BEVERAGE_LIST;

export type TBeverageNames = TBeverages[number]['name'];
