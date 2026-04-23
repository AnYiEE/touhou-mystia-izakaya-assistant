import { useCallback, useMemo } from 'react';

import { useSkipProcessItemData } from '@/hooks';

import { getSearchResult } from '@/utilities';
import type { TItemData, TItemInstance } from '@/utils/types';

export function useSearchResult<T extends TItemInstance>(
	instance: T,
	searchValue: string
) {
	const shouldSkipProcessData = useSkipProcessItemData();

	const getResult = useCallback(() => {
		if (searchValue) {
			return instance.data.filter((item) =>
				getSearchResult(searchValue, item)
			);
		}

		return instance.data;
	}, [instance.data, searchValue]);

	const searchResult = useMemo(
		() => (shouldSkipProcessData ? instance.data : getResult()),
		[getResult, instance.data, shouldSkipProcessData]
	);

	return searchResult as TItemData<T>;
}
