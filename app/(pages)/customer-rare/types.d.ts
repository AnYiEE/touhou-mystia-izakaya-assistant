import {type ReactNode} from 'react';
import {type SortDescriptor} from '@nextui-org/react';

import {type TabVisibilityState} from './constants';
import {type TCustomerNames} from '@/data';
import {type TBeverageInstance, type TRecipeInstance} from '@/methods/food/types';

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
	[key in TabVisibilityState]: ICustomerTab;
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

export type TBeverages = TBeverageInstance['data'];
export type TBeverage = TBeverages[number];
export type TBeverageWithSuitability = TBeverage & TBeverageSuitability;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

type TRecipeSuitability = {
	suitability: number;
	matchedPositiveTags: string[];
	matchedNegativeTags: string[];
};

export type TRecipes = TRecipeInstance['data'];
export type TRecipe = TRecipes[number];
export type TRecipeWithSuitability = TRecipe & TRecipeSuitability;
export type TRecipesWithSuitability = TRecipeWithSuitability[];
