import { type TItemName } from '@/data';
import type { IItemBase } from '@/data/types';

export interface IItem<T extends TItemName = TItemName> extends IItemBase {
	name: T;
}

export type TItemWithPinyin<T> = T & { pinyin: string[] };
