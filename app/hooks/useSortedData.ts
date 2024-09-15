import {useCallback, useMemo} from 'react';

import {useSkipProcessFoodData} from '@/hooks';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {
	type Beverage,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Recipe,
} from '@/utils';

type TTargetInstance = Beverage | CustomerNormal | CustomerRare | CustomerSpecial | Ingredient | Recipe;
type TData<T extends TTargetInstance> = T['data'];

export function useSortedData<T extends TTargetInstance>(
	instance: T,
	filteredData: TData<T>,
	pinyinSortState: PinyinSortState
) {
	const shouldSkipProcessData = useSkipProcessFoodData();

	const sortData = useCallback(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.sortByPinyin(filteredData as never);
			case PinyinSortState.ZA:
				return instance.sortByPinyin(filteredData as never).reverse();
			default:
				return filteredData;
		}
	}, [instance, filteredData, pinyinSortState]);

	const sortedData = useMemo(
		() => (shouldSkipProcessData ? filteredData : sortData()),
		[filteredData, shouldSkipProcessData, sortData]
	);

	return sortedData as TData<T>;
}
