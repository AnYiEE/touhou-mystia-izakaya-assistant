import {
	type TPinyinSortState,
	pinyinSortStateMap,
} from '@/components/sidePinyinSortIconButton';

import { type Item } from '@/utils/item/base';
import type { TItemDataItem, TItemInstance } from '@/utils/types';

type TName<T extends TItemInstance> = TItemDataItem<T>['name'];
type TNameCollection<T extends TItemInstance> = Array<
	ValueCollection<TName<T>>
>;

function getAllItemNames<T extends TItemInstance>(
	instance: T,
	pinyinSortState: TPinyinSortState
) {
	switch (pinyinSortState) {
		case pinyinSortStateMap.az: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				true,
				instance.getPinyinSortedData().get()
			) as TNameCollection<T>;
		case pinyinSortStateMap.za: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				true,
				instance.getPinyinSortedData().fork().reverse()
			) as TNameCollection<T>;
		default: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				true
			) as TNameCollection<T>;
	}
}

export function createNamesCache<T extends TItemInstance>(instance: T) {
	const cache = new Map<TPinyinSortState, TNameCollection<T>>();

	return function getNames(pinyinSortState: TPinyinSortState) {
		if (cache.has(pinyinSortState)) {
			cache.get(pinyinSortState);
		}

		const names = getAllItemNames(instance, pinyinSortState);
		cache.set(pinyinSortState, names);

		return names;
	};
}
