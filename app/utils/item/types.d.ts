import type {IItemBase} from '@/data/types';

interface IItem<T = string> extends IItemBase {
	name: T;
}

export type {IItem};
