import {type BEVERAGE_TAG_MAP} from '@/data/constant';
import type {IFoodBase} from '@/data/types';

type TFromBase = IFoodBase['from'];

interface IFrom extends Omit<TFromBase, 'fishing'> {
	/** @description Initial beverages. */
	self: boolean;
}

export interface IBeverage extends IFoodBase {
	tags: (keyof typeof BEVERAGE_TAG_MAP)[];
	from: Partial<IFrom>;
}

export type TBeverages = typeof import('./data').BEVERAGE_LIST;

export type TBeverageId = TBeverages[number]['id'];
export type TBeverageName = TBeverages[number]['name'];
