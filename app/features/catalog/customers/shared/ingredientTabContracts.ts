import { type Ingredient } from '@/domain/catalog/food/Ingredient';

import type { TItemData } from '@/features/catalog/shared/contracts';

import type { IIngredientsTabStyle } from './contracts';

export interface IIngredientTabContentProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<Ingredient>;
}
