import {type TBeverageName, type TCustomerName} from '@/data';
import {type ICustomerOrder} from '@/stores';
import type {IMealRecipe, IPopularTrend, TRatingKey} from '@/types';

export type TMealTarget = 'customer_normal' | 'customer_rare';

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
