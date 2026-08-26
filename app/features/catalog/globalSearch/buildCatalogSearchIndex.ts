import { type BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { type FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { type IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { type BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';
import { type ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { type CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { type CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { type DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { type FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { type GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import { type PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import { type RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';

import type { TItemData } from '@/features/catalog/shared/contracts';
import type { IGlobalSearchIndexItem } from '@/features/globalSearch/contracts';

import {
	buildBadgeItems,
	buildBeverageItems,
	buildCookerItems,
	buildFishingCollectibleItems,
	buildFoodItems,
	buildGeneralItemItems,
	buildGuestItems,
	buildIngredientItems,
	buildRecordItems,
	buildSimpleItemSection,
} from './sectionBuilders';

interface IGlobalSearchIndexDataOptions {
	badges?: TItemData<BadgeCatalog>;
	beverages?: TItemData<BeverageCatalog>;
	clothes?: TItemData<ClothesCatalog>;
	cookers?: TItemData<CookerCatalog>;
	currencyItems?: TItemData<CurrencyItemCatalog>;
	decorations?: TItemData<DecorationCatalog>;
	foods?: TItemData<FoodCatalog>;
	fishingCollectibles?: TItemData<FishingCollectibleCatalog>;
	generalItems?: TItemData<GeneralItemCatalog>;
	ingredients?: TItemData<IngredientCatalog>;
	normalGuests?: TItemData<NormalGuestCatalog>;
	partners?: TItemData<PartnerCatalog>;
	records?: TItemData<RecordItemCatalog>;
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
		...buildGeneralItemItems(data.generalItems),
		...buildRecordItems(data.records),
		...buildFishingCollectibleItems(data.fishingCollectibles),
		...buildBadgeItems(data.badges),
		...buildSimpleItemSection('decorations', data.decorations),
		...buildSimpleItemSection('clothes', data.clothes),
		...buildSimpleItemSection('partners', data.partners),
		...buildSimpleItemSection('currency-items', data.currencyItems),
		...buildGuestItems('special-guests', data.specialGuests),
		...buildGuestItems('normal-guests', data.normalGuests),
	];
}
