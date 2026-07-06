import { useCallback, useMemo } from 'react';

import { useSkipProcessItemData } from '@/hooks';

import { type TDlc } from '@/data';
import { globalStore as store } from '@/stores';
import type { TItemData, TItemInstance } from '@/utils/types';

type TDataItem<T> = T extends ReadonlyArray<infer Item> ? Item : never;
type THiddenDlcVisibilityPredicate<T> = (
	item: T,
	hiddenDlcs: ReadonlySet<TDlc>
) => boolean;

export function useFilteredData<
	T extends TItemInstance | TItemData<TItemInstance>,
	U extends T extends TItemInstance ? TItemData<T> : T,
>(
	instanceOrData: T,
	filterData: () => U,
	isVisibleWithHiddenDlcs?: THiddenDlcVisibilityPredicate<TDataItem<U>>
) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const hiddenDlcs = store.hiddenDlcs.use();

	const filterHiddenDlcs = useCallback(
		<S extends TItemData<TItemInstance>>(data: S) =>
			data.filter((item) =>
				isVisibleWithHiddenDlcs === undefined
					? !hiddenDlcs.has(item.dlc)
					: isVisibleWithHiddenDlcs(item as TDataItem<U>, hiddenDlcs)
			) as unknown as S,
		[hiddenDlcs, isVisibleWithHiddenDlcs]
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
