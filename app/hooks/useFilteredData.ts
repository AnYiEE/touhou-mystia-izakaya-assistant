import { useCallback, useMemo } from 'react';

import { useSkipProcessItemData } from '@/hooks';

import { globalStore as store } from '@/stores';
import type { TItemData, TItemInstance } from '@/utils/types';

export function useFilteredData<
	T extends TItemInstance | TItemData<TItemInstance>,
	U extends T extends TItemInstance ? TItemData<T> : T,
>(instanceOrData: T, filterData: () => U) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const hiddenDlcs = store.hiddenDlcs.use();

	const filterHiddenDlcs = useCallback(
		<S extends TItemData<TItemInstance>>(data: S) =>
			data.filter((item) => !hiddenDlcs.has(item.dlc)) as unknown as S,
		[hiddenDlcs]
	);

	const filteredData = useMemo(() => {
		if (shouldSkipProcessData) {
			if ('length' in instanceOrData) {
				return instanceOrData;
			}
			return instanceOrData.data;
		}
		return filterHiddenDlcs(filterData());
	}, [filterData, filterHiddenDlcs, instanceOrData, shouldSkipProcessData]);

	return filteredData as Readonly<U>;
}
