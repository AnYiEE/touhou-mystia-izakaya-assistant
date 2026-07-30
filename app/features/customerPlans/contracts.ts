import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TPlace } from '@/domain/data/places/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealRecipe } from '@/domain/meals/types';

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
