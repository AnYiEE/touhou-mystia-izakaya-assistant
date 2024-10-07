import {
	type Beverage,
	type Clothes,
	type Cooker,
	type CustomerNormal,
	type CustomerRare,
	type CustomerSpecial,
	type Ingredient,
	type Ornament,
	type Partner,
	type Recipe,
} from '@/utils';

export type TItemInstance =
	| Beverage
	| Clothes
	| Cooker
	| CustomerNormal
	| CustomerRare
	| CustomerSpecial
	| Ingredient
	| Ornament
	| Partner
	| Recipe;

export type TItemData<T extends TItemInstance> = T['data'];
