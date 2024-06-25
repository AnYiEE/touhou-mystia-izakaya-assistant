import {type TFoodNames} from '@/data';
import type {IFoodBase} from '@/data/types';

export interface IFood<T extends TFoodNames = TFoodNames> extends Omit<IFoodBase, 'from'> {
	name: T;
}
