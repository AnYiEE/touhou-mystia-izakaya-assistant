import {useMemo} from 'react';

import {useSkipProcessItemData} from '@/hooks';

import type {TItemData, TItemInstance} from '@/utils/types';

export function useFilteredData<T extends TItemInstance>(instance: T, filterData: () => TItemData<T>) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const filteredData = useMemo(
		() => (shouldSkipProcessData ? instance.data : filterData()),
		[filterData, instance.data, shouldSkipProcessData]
	);

	return filteredData as TItemData<T>;
}
