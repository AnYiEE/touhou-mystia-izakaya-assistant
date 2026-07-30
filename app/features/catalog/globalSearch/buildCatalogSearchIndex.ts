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

import type { TItemData } from '@/features/catalog/shared/contracts';
import type { IGlobalSearchIndexItem } from '@/features/globalSearch/contracts';

import {
	buildBeverageItems,
	buildCookerItems,
	buildCustomerItems,
	buildIngredientItems,
	buildRecipeItems,
	buildSimpleItemSection,
} from './sectionBuilders';

interface IGlobalSearchIndexDataOptions {
	beverages?: TItemData<Beverage>;
	clothes?: TItemData<Clothes>;
	cookers?: TItemData<Cooker>;
	currencies?: TItemData<Currency>;
	customerNormal?: TItemData<CustomerNormal>;
	customerRare?: TItemData<CustomerRare>;
	ingredients?: TItemData<Ingredient>;
	ornaments?: TItemData<Ornament>;
	partners?: TItemData<Partner>;
	recipes?: TItemData<Recipe>;
}

export function buildCatalogSearchIndex(
	data: IGlobalSearchIndexDataOptions = {}
): IGlobalSearchIndexItem[] {
	return [
		...buildRecipeItems(data.recipes),
		...buildBeverageItems(data.beverages),
		...buildIngredientItems(data.ingredients),
		...buildCookerItems(data.cookers),
		...buildSimpleItemSection('ornaments', data.ornaments),
		...buildSimpleItemSection('clothes', data.clothes),
		...buildSimpleItemSection('partners', data.partners),
		...buildSimpleItemSection('currencies', data.currencies),
		...buildCustomerItems('customer-rare', data.customerRare),
		...buildCustomerItems('customer-normal', data.customerNormal),
	];
}
