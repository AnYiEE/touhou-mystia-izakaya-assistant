import {useMemo} from 'react';

import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {TCustomerInstances, TFoodInstances} from '@/methods/types';
import {type Item} from '@/utils/item';

type TTargetInstance = TCustomerInstances | TFoodInstances;
type TNames<T extends TTargetInstance> = T['data'][number]['name'];

export function useAllItemNames<T extends TTargetInstance>(instance: T, pinyinSortState: PinyinSortState) {
	const allNames = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return (instance as Item<any>).getValuesByProp(instance.dataPinyinSorted, 'name', true);
			case PinyinSortState.ZA:
				return (instance as Item<any>).getValuesByProp(instance.dataPinyinSorted.toReversed(), 'name', true);
			default:
				return (instance as Item<any>).getValuesByProp(instance.data, 'name', true);
		}
	}, [pinyinSortState, instance]);

	return allNames as {
		value: TNames<T>;
	}[];
}
