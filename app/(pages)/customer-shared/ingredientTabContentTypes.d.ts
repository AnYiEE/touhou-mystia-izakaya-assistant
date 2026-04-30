import type { IIngredientsTabStyle } from '@/(pages)/customer-shared/types';
import { type Ingredient } from '@/utils';
import type { TItemData } from '@/utils/types';

export interface IIngredientTabContentProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<Ingredient>;
}
