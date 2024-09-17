import {
	type Beverage,
	type Cooker,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Recipe,
} from '@/utils';

export type TItemInstance = Beverage | Cooker | CustomerNormal | CustomerRare | CustomerSpecial | Ingredient | Recipe;
export type TItemData<T extends TItemInstance> = T['data'];
