import { type SortDescriptor } from '@heroui/table';

import { type tabVisibilityStateMap } from './constants';
import { type TBeverageTag, type TRecipeTag } from '@/data';
import type { TBeverage, TRecipe } from '@/utils/types';

export type TTabVisibilityState = ExtractCollectionValue<
	typeof tabVisibilityStateMap
>;

export interface ICustomerTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TCustomerTabStyleMap = Record<
	TTabVisibilityState,
	ICustomerTabStyle
>;

export interface IIngredientsTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TIngredientsTabStyleMap = Record<
	TTabVisibilityState,
	IIngredientsTabStyle
>;

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

interface IBeverageSuitability {
	matchedTags: TBeverageTag[];
	suitability: number;
}

export type TBeverageWithSuitability = Prettify<
	TBeverage & IBeverageSuitability
>;
export type TBeveragesWithSuitability = TBeverageWithSuitability[];

interface IRecipeSuitability {
	matchedNegativeTags: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
}

export type TRecipeWithSuitability = Prettify<TRecipe & IRecipeSuitability>;
export type TRecipesWithSuitability = TRecipeWithSuitability[];

export type TTab = 'beverage' | 'customer' | 'ingredient' | 'recipe';
