import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import type {TCustomerInstances, TFoodInstances} from '@/methods/types';
import {type Item} from '@/utils/item';

type TTargetInstance = TCustomerInstances | TFoodInstances;
type TNames<T extends TTargetInstance> = T['data'][number]['name'];
type TNameObject<T extends TTargetInstance> = {
	value: TNames<T>;
}[];

export function getAllItemNames<T extends TTargetInstance>(instance: T, pinyinSortState: PinyinSortState) {
	switch (pinyinSortState) {
		case PinyinSortState.AZ: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(instance.dataPinyinSorted, 'name', true) as TNameObject<T>;
		case PinyinSortState.ZA: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(
				instance.dataPinyinSorted.toReversed(),
				'name',
				true
			) as TNameObject<T>;
		default: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(instance.data, 'name', true) as TNameObject<T>;
	}
}
