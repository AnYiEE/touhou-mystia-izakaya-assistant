import {useCallback, useMemo} from 'react';

import {useSkipProcessFoodData} from '@/hooks';

import {
	type Beverage,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Recipe,
	processPinyin,
} from '@/utils';

type TTargetInstance = Beverage | CustomerNormal | CustomerRare | CustomerSpecial | Ingredient | Recipe;
type TData<T extends TTargetInstance> = T['data'];

export function useSearchResult<T extends TTargetInstance>(instance: T, searchValue: string) {
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

	return searchResult as TData<T>;
}
