import type {Businessman, CollectionLocation, Task, IFoodBase} from '@/data/types';

type Tag =
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

type FromBase = IFoodBase['from'];

interface IFrom extends FromBase {
	/** @description 初始拥有的饮品 */
	self: boolean;
}

interface IBeverage extends IFoodBase {
	tag: Tag[];
	from: Partial<IFrom>;
}

export type {IBeverage};
