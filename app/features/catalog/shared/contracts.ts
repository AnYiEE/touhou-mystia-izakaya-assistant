import { type CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { type CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { type Beverage } from '@/domain/catalog/food/Beverage';
import { type Ingredient } from '@/domain/catalog/food/Ingredient';
import { type Recipe } from '@/domain/catalog/food/Recipe';
import { type Clothes } from '@/domain/catalog/items/Clothes';
import { type Cooker } from '@/domain/catalog/items/Cooker';
import { type Currency } from '@/domain/catalog/items/Currency';
import { type Ornament } from '@/domain/catalog/items/Ornament';
import { type Partner } from '@/domain/catalog/items/Partner';

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
