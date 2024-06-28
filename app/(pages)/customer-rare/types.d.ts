import {type ReactNode} from 'react';
import {type SortDescriptor} from '@nextui-org/react';

import {type CustomerTabVisibilityState} from './constants';
import {type TCustomerNames} from '@/data';
import {type foodInstances} from '@/methods/food';

export type TCustomerTarget = 'customer_rare' | 'customer_special';

export interface ICurrentCustomer {
	name: TCustomerNames;
	target: TCustomerTarget;
}

export interface ICustomerTabStyle {
	buttonNode: ReactNode;
	contentClassName: string;
	sideButtonGroupClassName: string;
}

export interface ICustomerTabStyleMap {
	[key in CustomerTabVisibilityState]: ICustomerTab;
}

export interface ITableColumn<T extends string> {
	key: T;
	label: string;
	sortable: boolean;
}

export interface ITableSortDescriptor<T extends string> extends SortDescriptor {
	column?: T;
	direction?: NonNullable<SortDescriptor['direction']>;
}

type TBeverageSuitability = {
	suitability: number;
	matchedTags: string[];
};

export type TBeverages = (typeof foodInstances)['beverage']['data'];
export type TBeverage = TBeverages[number];
export type TBeverageWithSuitability = TBeverage & TBeverageSuitability;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

type TRecipeSuitability = {
	suitability: number;
	matchedPositiveTags: string[];
	matchedNegativeTags: string[];
};

export type TRecipes = (typeof foodInstances)['recipe']['data'];
export type TRecipe = TRecipes[number];
export type TRecipeWithSuitability = TRecipe & TRecipeSuitability;
export type TRecipesWithSuitability = TRecipeWithSuitability[];
