import { useMemo } from 'react';

import { useSkipProcessItemData } from '@/hooks';

import type { TItemData, TItemInstance } from '@/utils/types';

export function useFilteredData<
	T extends TItemInstance | TItemData<TItemInstance>,
	U extends T extends TItemInstance ? TItemData<T> : T,
>(instanceOrData: T, filterData: () => U) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const filteredData = useMemo(() => {
		if (shouldSkipProcessData) {
			if ('length' in instanceOrData) {
				return instanceOrData;
			}
			return instanceOrData.data;
		}
		return filterData();
	}, [filterData, instanceOrData, shouldSkipProcessData]);

	return filteredData as U;
}
