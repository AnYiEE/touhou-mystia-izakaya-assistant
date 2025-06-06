import {type TBeverageName, type TBeverageTag, type TCustomerName, type TRecipeTag} from '@/data';
import type {IMealRecipe, IPopularTrend, TRatingKey} from '@/types';

export interface ICustomerOrder {
	beverageTag: TBeverageTag | null;
	recipeTag: TRecipeTag | null;
}

export interface IMeal<T extends TCustomerName = TCustomerName> {
	customerName: T | null;
	customerOrder: ICustomerOrder;
	hasMystiaCooker: boolean;
	beverageName: TBeverageName | null;
	recipeData: IMealRecipe | null;
	isDarkMatter: boolean;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	rating: TRatingKey | null;
}

export type TMealTarget = 'customer_normal' | 'customer_rare';
