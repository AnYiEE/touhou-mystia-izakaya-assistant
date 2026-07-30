import { useCallback, useMemo } from 'react';

import type {
	TItemData,
	TItemInstance,
} from '@/features/catalog/shared/contracts';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';

import { useSkipProcessItemData } from './useSkipProcessItemData';

export function useSortedData<T extends TItemInstance>(
	instance: T,
	filteredData: TItemData<T>,
	pinyinSortState: TPinyinSortState
) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const sortData = useCallback(() => {
		switch (pinyinSortState) {
			case PINYIN_SORT_STATE_MAP.ascending:
				return instance
					.getPinyinSortedData(filteredData as never)
					.get();
			case PINYIN_SORT_STATE_MAP.descending:
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
