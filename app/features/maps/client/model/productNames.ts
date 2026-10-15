import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import { checkBeverageId, checkIngredientId } from './dayMapEntities';

const beverageCatalog = BeverageCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();

/** @description Localized name of a collection product (ingredient or beverage). */
export function getProductName({
	productId,
	productType,
}: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>) {
	if (productType === 1 && checkIngredientId(productId)) {
		return ingredientCatalog.getDisplayPropsById(productId, 'name');
	}
	if (productType === 2 && checkBeverageId(productId)) {
		return beverageCatalog.getDisplayPropsById(productId, 'name');
	}

	return String(productId);
}
