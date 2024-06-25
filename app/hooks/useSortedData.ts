import {useMemo} from 'react';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {TCustomerInstances, TFoodInstances} from '@/methods/types';

type TTargetInstance = TCustomerInstances | TFoodInstances;
type TData<T extends TTargetInstance> = T['data'];

export function useSortedData<T extends TTargetInstance>(
	instance: T,
	filteredData: TData<T>,
	pinyinSortState: PinyinSortState
) {
	const sortedData = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.sortByPinyin(filteredData as never);
			case PinyinSortState.ZA:
				return instance.sortByPinyin(filteredData as never).reverse();
			default:
				return filteredData;
		}
	}, [instance, filteredData, pinyinSortState]);

	return sortedData as TData<T>;
}
