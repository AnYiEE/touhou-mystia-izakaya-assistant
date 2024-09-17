import {useCallback, useMemo} from 'react';

import {useSkipProcessItemData} from '@/hooks';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {TItemData, TItemInstance} from '@/utils/types';

export function useSortedData<T extends TItemInstance>(
	instance: T,
	filteredData: TItemData<T>,
	pinyinSortState: PinyinSortState
) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const sortData = useCallback(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.sortByPinyin(filteredData as never);
			case PinyinSortState.ZA:
				return instance.sortByPinyin(filteredData as never).reverse();
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
