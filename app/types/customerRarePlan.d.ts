import {
	type TBeverageName,
	type TBeverageTag,
	type TCustomerRareName,
	type TPlace,
	type TRecipeTag,
} from '@/data';
import { type TRatingKey } from './evaluation';
import { type IMealRecipe } from './meal';

export type TCustomerRarePlanCustomerSort =
	| 'default'
	| 'pinyin-asc'
	| 'pinyin-asc-flat'
	| 'pinyin-desc'
	| 'pinyin-desc-flat';
export type TCustomerRarePlanMealSource = 'recommended' | 'saved';
export type TCustomerRarePlanMode = 'manual' | 'region';

export interface ICustomerRareMeal {
	beverage: TBeverageName;
	hasMystiaCooker: boolean;
	order: { beverageTag: TBeverageTag | null; recipeTag: TRecipeTag | null };
	recipe: IMealRecipe;
}

export interface ICustomerRarePlan {
	createdAt: number;
	customerSort: TCustomerRarePlanCustomerSort;
	excludes: TCustomerRareName[];
	id: string;
	includes: TCustomerRareName[];
	manualCustomers: TCustomerRareName[];
	mealSource: TCustomerRarePlanMealSource;
	mode: TCustomerRarePlanMode;
	name: string;
	places: TPlace[];
	updatedAt: number;
}

export interface ICustomerRarePlansState {
	activeId: string | null;
	items: ICustomerRarePlan[];
}

export interface IResolvedCustomerRarePlanMeal {
	dataIndex: number | null;
	evaluation: {
		isDarkMatter: boolean;
		price: number;
		rating: TRatingKey | null;
	};
	meal: ICustomerRareMeal;
	recommendedSetIndex: number | null;
	source: TCustomerRarePlanMealSource;
	visibleIndex: number;
}

export interface IResolvedCustomerRarePlanGroup {
	customerName: TCustomerRareName;
	customerPlaces: TPlace[];
	mealSource: TCustomerRarePlanMealSource;
	meals: IResolvedCustomerRarePlanMeal[];
	visibleMealCount: number;
}
