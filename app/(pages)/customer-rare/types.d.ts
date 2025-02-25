import {type SortDescriptor} from '@heroui/table';

import {type TabVisibilityState} from './constants';
import {type TBeverageTag, type TRecipeTag} from '@/data';
import type {TBeverage, TRecipe} from '@/utils/types';

export interface ICustomerTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: {
		content: string;
		sideButtonGroup: string;
	};
}

export interface ICustomerTabStyleMap {
	[key in TabVisibilityState]: ICustomerTabStyle;
}

export interface IIngredientsTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: {
		content: string;
		sideButtonGroup: string;
	};
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
	direction?: SortDescriptor['direction'];
	lastColumn?: T;
	time?: number;
}

type TBeverageSuitability = {
	matchedTags: TBeverageTag[];
	suitability: number;
};

export type TBeverageWithSuitability = TBeverage & TBeverageSuitability;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

type TRecipeSuitability = {
	matchedNegativeTags: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
};

export type TRecipeWithSuitability = TRecipe & TRecipeSuitability;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type TTab = 'beverage' | 'customer' | 'ingredient' | 'recipe';
