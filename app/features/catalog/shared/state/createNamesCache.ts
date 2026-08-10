import { type Item } from '@/domain/catalog/shared/Item';

import type {
	TItemDataItem,
	TItemInstance,
} from '@/features/catalog/shared/contracts';

import { PINYIN_SORT_STATE_MAP, type TPinyinSortState } from './pinyinSort';

type TName<T extends TItemInstance> = TItemDataItem<T>['name'];
type TNames<T extends TItemInstance> = Array<TName<T>>;

function getAllItemNames<T extends TItemInstance>(
	instance: T,
	pinyinSortState: TPinyinSortState
) {
	switch (pinyinSortState) {
		case PINYIN_SORT_STATE_MAP.ascending: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				false,
				instance.getPinyinSortedData()
			) as TNames<T>;
		case PINYIN_SORT_STATE_MAP.descending: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				false,
				instance.getPinyinSortedData().toReversed()
			) as TNames<T>;
		default: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				'name',
				false
			) as TNames<T>;
	}
}

export function createNamesCache<T extends TItemInstance>(instance: T) {
	const cache = new Map<TPinyinSortState, TNames<T>>();

	return function getNames(pinyinSortState: TPinyinSortState) {
		return cache.getOrInsertComputed(pinyinSortState, () =>
			getAllItemNames(instance, pinyinSortState)
		);
	};
}
