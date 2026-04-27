import type { IIngredientsTabStyle } from './types';
import { type Ingredient } from '@/utils';
import type { TItemData } from '@/utils/types';

export interface IIngredientTabContentProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<Ingredient>;
}
