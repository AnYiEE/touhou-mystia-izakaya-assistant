import {useMemo} from 'react';

import type {TCustomerInstances, TFoodInstances} from '@/methods/types';
import {processPinyin} from '@/utils';

type TTargetInstance = TCustomerInstances | TFoodInstances;
type TData<T extends TTargetInstance> = T['data'];

export function useSearchResult<T extends TTargetInstance>(instance: T, searchValue: string) {
	const searchResult = useMemo(() => {
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

	return searchResult as TData<T>;
}
