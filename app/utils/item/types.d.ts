import type {IItemBase} from '@/data/types';

interface IItem<T = string> extends IItemBase {
	name: T;
}

type TItemProcessed<T> = T & {
	pinyin: string[];
};

export type {IItem, TItemProcessed};
