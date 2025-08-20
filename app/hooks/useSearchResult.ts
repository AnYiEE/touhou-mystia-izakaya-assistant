import { useCallback, useMemo } from 'react';

import { useSkipProcessItemData } from '@/hooks';

import { processPinyin } from '@/utilities';
import type { TItemData, TItemInstance } from '@/utils/types';

export function getSearchResult(
	searchValue: string,
	{ name, pinyin }: { name: string; pinyin: string[] }
) {
	const nameToLowerCase = name.toLowerCase();
	const { pinyinFirstLetters, pinyinWithoutTone } = processPinyin(pinyin);
	const searchValueLowerCase = searchValue.toLowerCase();

	return (
		nameToLowerCase.includes(searchValueLowerCase) ||
		// eslint-disable-next-line unicorn/prefer-string-replace-all
		nameToLowerCase.replace(/\s+/gu, '').includes(searchValueLowerCase) ||
		pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
		pinyinFirstLetters.includes(searchValueLowerCase)
	);
}

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
