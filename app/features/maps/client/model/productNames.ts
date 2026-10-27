import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';

import { checkBeverageId, checkIngredientId } from './dayMapEntities';
import { type TMapItemProduct } from './mapsHistory';

const beverageCatalog = BeverageCatalog.getInstance();
const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const fishingCollectibleCatalog = FishingCollectibleCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();

/** @description Localized name of a map product. */
export function getProductName({ productId, productType }: TMapItemProduct) {
	if (productType === 1 && checkIngredientId(productId)) {
		return ingredientCatalog.getDisplayPropsById(productId, 'name');
	}
	if (productType === 2 && checkBeverageId(productId)) {
		return beverageCatalog.getDisplayPropsById(productId, 'name');
	}
	if (productType === 'currency') {
		return currencyItemCatalog.getDisplayPropsById(productId, 'name');
	}
	if (productType === 'trophy') {
		return fishingCollectibleCatalog.getDisplayPropsById(productId, 'name');
	}

	return String(productId);
}
