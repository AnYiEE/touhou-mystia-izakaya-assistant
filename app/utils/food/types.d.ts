import {type FoodNames} from '@/data';
import type {IFoodBase} from '@/data/types';

export interface IFood<T extends FoodNames = FoodNames> extends Omit<IFoodBase, 'from'> {
	name: T;
}
