import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TBeverageTagId } from '@/domain/data/tags/types';

type TFromBase = IFoodBase['from'];

interface IFrom extends Omit<TFromBase, 'fishing'> {
	/** @description Initial beverages. */
	self: true;
}

export interface IBeverage extends IFoodBase {
	from: Partial<IFrom>;
	tags: TBeverageTagId[];
}
