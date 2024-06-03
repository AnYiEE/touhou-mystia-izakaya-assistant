import type {IFoodBase} from '@/data/types';

interface IFood<T = string> extends Omit<IFoodBase, 'from'> {
	name: T;
}

export type {IFood};
