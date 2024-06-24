import {useMemo} from 'react';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {CustomerInstances, FoodInstances} from '@/methods/types';

type TargetInstance = CustomerInstances | FoodInstances;
type Data<T extends TargetInstance> = T['data'];

export function useSortedData<T extends TargetInstance>(
	instance: T,
	filteredData: Data<T>,
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

	return sortedData as Data<T>;
}
