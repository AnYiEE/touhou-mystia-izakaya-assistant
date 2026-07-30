import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';

export interface ICustomerOrder {
	beverageTag: TBeverageTag | null;
	recipeTag: TRecipeTag | null;
}
