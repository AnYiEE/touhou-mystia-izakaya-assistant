import {useMemo} from 'react';

import type {TCustomerInstances, TFoodInstances} from '@/methods/types';

type TTargetInstance = TCustomerInstances | TFoodInstances;
type TData<T extends TTargetInstance> = T['data'];

export function useSearchResult<T extends TTargetInstance>(instance: T, searchValue: string) {
	const searchResult = useMemo(() => {
		if (searchValue) {
			return instance.data.filter(({name}) => name.toLowerCase().includes(searchValue.toLowerCase()));
		}
		return instance.data;
	}, [instance.data, searchValue]);

	return searchResult as TData<T>;
}
