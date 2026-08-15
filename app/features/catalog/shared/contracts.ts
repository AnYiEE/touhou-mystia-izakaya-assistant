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

export type TItemInstance =
	| BeverageCatalog
	| ClothesCatalog
	| CookerCatalog
	| CurrencyItemCatalog
	| DecorationCatalog
	| FoodCatalog
	| IngredientCatalog
	| NormalGuestCatalog
	| PartnerCatalog
	| SpecialGuestCatalog;

export type TItemData<T extends TItemInstance> = T['data'];
export type TItemDataItem<T extends TItemInstance> = TItemData<T>[number];
