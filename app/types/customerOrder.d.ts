import { type TBeverageTag, type TRecipeTag } from '@/data';

export interface ICustomerOrder {
	beverageTag: TBeverageTag | null;
	recipeTag: TRecipeTag | null;
}
