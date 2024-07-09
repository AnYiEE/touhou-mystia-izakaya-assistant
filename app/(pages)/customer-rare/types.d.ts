import {type ReactNode} from 'react';
import {type AvatarProps, type SortDescriptor} from '@nextui-org/react';

import {type TabVisibilityState} from './constants';
import {type TCustomerNames} from '@/data';
import type {TBeverageInstance, TRecipeInstance} from '@/methods/food/types';

export type TCustomerTarget = 'customer_rare' | 'customer_special';

export interface ICurrentCustomer {
	name: TCustomerNames;
	target: TCustomerTarget;
}

export type TCustomerRating = '极度不满' | '不满' | '普通' | '满意' | '完美';

export interface ICustomerRatingMap {
	[key in TCustomerRating]: AvatarProps['color'];
}

export interface ICustomerTabStyle {
	ariaLabel: string;
	buttonNode: ReactNode;
	contentClassName: string;
	sideButtonGroupClassName: string;
}

export interface ICustomerTabStyleMap {
	[key in TabVisibilityState]: ICustomerTabStyle;
}

export interface IIngredientsTabStyle {
	ariaLabel: string;
	buttonNode: ReactNode;
	contentClassName: string;
	sideButtonGroupClassName: string;
}

export interface IIngredientsTabStyleMap {
	[key in TabVisibilityState]: IIngredientsTabStyle;
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
	matchedTags: string[];
	suitability: number;
};

type TBeverages = TBeverageInstance['data'];
type TBeverage = TBeverages[number];
export type TBeverageWithSuitability = TBeverage & TBeverageSuitability;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

type TRecipeSuitability = {
	matchedNegativeTags: string[];
	matchedPositiveTags: string[];
	suitability: number;
};

type TRecipes = TRecipeInstance['data'];
type TRecipe = TRecipes[number];
export type TRecipeWithSuitability = TRecipe & TRecipeSuitability;
export type TRecipesWithSuitability = TRecipeWithSuitability[];
