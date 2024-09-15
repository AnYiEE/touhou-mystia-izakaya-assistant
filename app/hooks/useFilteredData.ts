import {useMemo} from 'react';

import {useSkipProcessFoodData} from '@/hooks';

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

export function useFilteredData<T extends TTargetInstance>(instance: T, filterData: () => TData<T>) {
	const shouldSkipProcessData = useSkipProcessFoodData();

	const filteredData = useMemo(
		() => (shouldSkipProcessData ? instance.data : filterData()),
		[filterData, instance.data, shouldSkipProcessData]
	);

	return filteredData as TData<T>;
}
