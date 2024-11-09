import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {type Item} from '@/utils/item';
import type {TItemDataItem, TItemInstance} from '@/utils/types';

type TNames<T extends TItemInstance> = TItemDataItem<T>['name'];
type TNameObject<T extends TItemInstance> = {
	value: TNames<T>;
}[];

export function getAllItemNames<T extends TItemInstance>(instance: T, pinyinSortState: PinyinSortState) {
	switch (pinyinSortState) {
		case PinyinSortState.AZ: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(instance.dataPinyinSorted, 'name', true) as TNameObject<T>;
		case PinyinSortState.ZA: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				[...instance.dataPinyinSorted].reverse(),
				'name',
				true
			) as TNameObject<T>;
		default: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(instance.data, 'name', true) as TNameObject<T>;
	}
}
