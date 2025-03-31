import {useCallback, useMemo} from 'react';

import {useSkipProcessItemData} from '@/hooks';

import {type TPinyinSortState, pinyinSortStateMap} from '@/components/sidePinyinSortIconButton';

import type {TItemData, TItemInstance} from '@/utils/types';

export function useSortedData<T extends TItemInstance>(
	instance: T,
	filteredData: TItemData<T>,
	pinyinSortState: TPinyinSortState
) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const sortData = useCallback(() => {
		switch (pinyinSortState) {
			case pinyinSortStateMap.az:
				return instance.getPinyinSortedData(filteredData as never).get();
			case pinyinSortStateMap.za:
				return instance
					.getPinyinSortedData(filteredData as never)
					.fork()
					.reverse();
			default:
				return filteredData;
		}
	}, [instance, filteredData, pinyinSortState]);

	const sortedData = useMemo(
		() => (shouldSkipProcessData ? filteredData : sortData()),
		[filteredData, shouldSkipProcessData, sortData]
	);

	return sortedData as TItemData<T>;
}
