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

export type TItemInstance =
	| BadgeCatalog
	| BeverageCatalog
	| ClothesCatalog
	| CookerCatalog
	| CurrencyItemCatalog
	| DecorationCatalog
	| FishingCollectibleCatalog
	| FoodCatalog
	| GeneralItemCatalog
	| IngredientCatalog
	| NormalGuestCatalog
	| PartnerCatalog
	| RecordItemCatalog
	| SpecialGuestCatalog;

export type TItemData<T extends TItemInstance> = T['data'];
export type TItemDataItem<T extends TItemInstance> = TItemData<T>[number];
