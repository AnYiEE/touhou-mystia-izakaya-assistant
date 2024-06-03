import type {Businessman, CollectionLocation, Task, IFoodBase, IFoodFrom} from '@/data/types';

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

interface IBeverage extends IFoodBase {
	tag: Tag[];
	from:
		| IFoodBase['from']
		| {
				/** @description 初始拥有的饮品 */
				self: true;
		  };
}

export type {IBeverage};
