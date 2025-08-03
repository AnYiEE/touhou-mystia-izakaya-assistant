import { type TFoodName } from '@/data';
import type { IFoodBase } from '@/data/types';

export interface IFood<T extends TFoodName = TFoodName>
	extends Omit<IFoodBase, 'from'> {
	name: T;
}
