import {
	type Beverage,
	type Clothes,
	type Cooker,
	type Currency,
	type CustomerNormal,
	type CustomerRare,
	type Ingredient,
	type Ornament,
	type Partner,
	type Recipe,
} from '@/utils';

export type TItemInstance =
	| Beverage
	| Clothes
	| Cooker
	| Currency
	| CustomerNormal
	| CustomerRare
	| Ingredient
	| Ornament
	| Partner
	| Recipe;

export type TItemData<T extends TItemInstance> = T['data'];
export type TItemDataItem<T extends TItemInstance> = TItemData<T>[number];
