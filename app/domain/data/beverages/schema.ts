import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TBeverageTagSchema } from '@/domain/data/tags/schema';

type TFromBase = IFoodBase['from'];

interface IFrom extends Omit<TFromBase, 'fishing'> {
	/** @description Initial beverages. */
	self: boolean;
}

export interface IBeverage extends IFoodBase {
	tags: TBeverageTagSchema[];
	from: Partial<IFrom>;
}
