import { type IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';

import type { TItemData } from '@/features/catalog/shared/contracts';

import type { IIngredientsTabStyle } from './contracts';

export interface IIngredientTabContentProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<IngredientCatalog>;
}
