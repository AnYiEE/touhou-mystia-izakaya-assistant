import type {IItemBase} from '@/data/types';

export interface IItem<T extends string = string> extends IItemBase {
	name: T;
}

export type TItemWithPinyin<T> = T & {
	pinyin: string[];
};
