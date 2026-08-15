import { type BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { type FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { type IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { type CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { type CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { type DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { type PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';

import type { TItemData } from '@/features/catalog/shared/contracts';
import type { IGlobalSearchIndexItem } from '@/features/globalSearch/contracts';

import {
	buildBeverageItems,
	buildCookerItems,
	buildFoodItems,
	buildGuestItems,
	buildIngredientItems,
	buildSimpleItemSection,
} from './sectionBuilders';

interface IGlobalSearchIndexDataOptions {
	beverages?: TItemData<BeverageCatalog>;
	clothes?: TItemData<ClothesCatalog>;
	cookers?: TItemData<CookerCatalog>;
	currencyItems?: TItemData<CurrencyItemCatalog>;
	decorations?: TItemData<DecorationCatalog>;
	foods?: TItemData<FoodCatalog>;
	ingredients?: TItemData<IngredientCatalog>;
	normalGuests?: TItemData<NormalGuestCatalog>;
	partners?: TItemData<PartnerCatalog>;
	specialGuests?: TItemData<SpecialGuestCatalog>;
}

export function buildCatalogSearchIndex(
	data: IGlobalSearchIndexDataOptions = {}
): IGlobalSearchIndexItem[] {
	return [
		...buildFoodItems(data.foods),
		...buildBeverageItems(data.beverages),
		...buildIngredientItems(data.ingredients),
		...buildCookerItems(data.cookers),
		...buildSimpleItemSection('decorations', data.decorations),
		...buildSimpleItemSection('clothes', data.clothes),
		...buildSimpleItemSection('partners', data.partners),
		...buildSimpleItemSection('currency-items', data.currencyItems),
		...buildGuestItems('special-guests', data.specialGuests),
		...buildGuestItems('normal-guests', data.normalGuests),
	];
}
