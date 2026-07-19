import { type TItemName } from '@/data';
import type { IItemBase } from '@/data/types';
import type { IAvailabilityItemData } from '@/utils/availability/types';

export interface IItem<T extends TItemName = TItemName> extends IItemBase {
	name: T;
}

export type TItemWithPinyin<T> = T & { pinyin: string[] };

export type TAvailabilityItemWithPinyin<T> = TItemWithPinyin<T> &
	IAvailabilityItemData;
