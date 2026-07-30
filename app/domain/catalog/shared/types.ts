import type { IAvailabilityItemData } from '@/domain/availability/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TItemName } from '@/domain/data/types';

export interface IItem<T extends TItemName = TItemName> extends IItemBase {
	name: T;
}

export type TItemWithPinyin<T> = T & { pinyin: string[] };

export type TAvailabilityItemWithPinyin<T> = TItemWithPinyin<T> &
	IAvailabilityItemData;
