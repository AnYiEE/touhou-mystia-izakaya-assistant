import {useMemo} from 'react';

import type {CustomerInstances, FoodInstances} from '@/methods/types';

type TargetInstance = CustomerInstances | FoodInstances;
type Data<T extends TargetInstance> = T['data'];

export function useSearchResult<T extends TargetInstance>(instance: T, searchValue: string) {
	const searchResult = useMemo(() => {
		if (searchValue) {
			return instance.data.filter(({name}) => name.toLowerCase().includes(searchValue.toLowerCase()));
		}
		return instance.data;
	}, [instance.data, searchValue]);

	return searchResult as Data<T>;
}
