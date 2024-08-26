import {PinyinSortState} from '@/components/sidePinyinSortIconButton';

import {
	type Beverage,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Recipe,
} from '@/utils';
import {type Item} from '@/utils/item';

type TTargetInstance = Beverage | CustomerNormal | CustomerRare | CustomerSpecial | Ingredient | Recipe;
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
				[...instance.dataPinyinSorted].reverse(),
				'name',
				true
			) as TNameObject<T>;
		default: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (instance as Item<any>).getValuesByProp(instance.data, 'name', true) as TNameObject<T>;
	}
}
