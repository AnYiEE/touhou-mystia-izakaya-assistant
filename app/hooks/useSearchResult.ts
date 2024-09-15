import {useCallback, useMemo} from 'react';

import {useSkipProcessFoodData} from '@/hooks';

import {processPinyin} from '@/utils';
import type {TItemData, TItemInstance} from '@/utils/types';

export function useSearchResult<T extends TItemInstance>(instance: T, searchValue: string) {
	const shouldSkipProcessData = useSkipProcessFoodData();

	const getSearchResult = useCallback(() => {
		if (searchValue) {
			const searchValueLowerCase = searchValue.toLowerCase();

			return instance.data.filter(({name, pinyin}) => {
				const {pinyinFirstLetters, pinyinWithoutTone} = processPinyin(pinyin);

				return (
					name.toLowerCase().includes(searchValueLowerCase) ||
					pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
					pinyinFirstLetters.includes(searchValueLowerCase)
				);
			});
		}

		return instance.data;
	}, [instance.data, searchValue]);

	const searchResult = useMemo(
		() => (shouldSkipProcessData ? instance.data : getSearchResult()),
		[getSearchResult, instance.data, shouldSkipProcessData]
	);

	return searchResult as TItemData<T>;
}
