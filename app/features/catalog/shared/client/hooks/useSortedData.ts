import { useCallback, useMemo } from 'react';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
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
	const revision = useCatalogLocalizationRevision();
	const shouldSkipProcessData = useSkipProcessItemData();

	const sortData = useCallback(() => {
		void revision;
		switch (pinyinSortState) {
			case PINYIN_SORT_STATE_MAP.ascending:
				return instance.getPinyinSortedData(filteredData as never);
			case PINYIN_SORT_STATE_MAP.descending:
				return instance
					.getPinyinSortedData(filteredData as never)
					.toReversed();
			default:
				return filteredData;
		}
	}, [instance, filteredData, pinyinSortState, revision]);

	const sortedData = useMemo(() => {
		void revision;
		return shouldSkipProcessData ? filteredData : sortData();
	}, [filteredData, revision, shouldSkipProcessData, sortData]);

	return sortedData as TItemData<T>;
}
