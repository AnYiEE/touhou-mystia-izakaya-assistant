import { type SortDescriptor } from '@heroui/table';

import {
	type TBeverageTag,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';
import type { TBeverage, TRecipe } from '@/utils/types';

export interface ITableSortDescriptor<T extends string> extends SortDescriptor {
	column?: T;
	direction?: SortDescriptor['direction'];
	lastColumn?: T;
	time?: number;
}

export type TRecipeTableSortKey = 'recipe' | 'price' | 'suitability' | 'time';
export type TBeverageTableSortKey = 'beverage' | 'price' | 'suitability';

export interface ISearchableItem {
	name: string;
	pinyin: string[];
}

export type TSearchMatcher = (
	searchValue: string,
	item: ISearchableItem
) => boolean;

export interface IIngredientScoreCandidate {
	name: TIngredientName;
	tags: ReadonlyArray<TIngredientTag>;
}

export type TIngredientScoreRestriction =
	| 'darkIngredient'
	| 'darkMatterOverride'
	| 'highestRestricted'
	| 'lowestRestricted'
	| 'none';

export interface IIngredientScoreChangeEntry {
	isDarkIngredient: boolean;
	isOrderTag: boolean;
	restriction: TIngredientScoreRestriction;
	scoreChange: number;
}

export type TIngredientScoreChanges = Partial<
	Record<TIngredientName, IIngredientScoreChangeEntry>
>;

export interface IIngredientScoreChangesResult {
	changesByName: TIngredientScoreChanges;
	darkIngredientNames: TIngredientName[];
}

interface IRecipeSuitability {
	matchedNegativeTags?: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number;
}

export type TRecipeSuitabilityRow = Prettify<TRecipe & IRecipeSuitability>;

export interface IRecipeSuitabilityRowsResult {
	filteredRows: TRecipeSuitabilityRow[];
	pagedRows: TRecipeSuitabilityRow[];
	sortedRows: TRecipeSuitabilityRow[];
	totalPages: number;
}

interface IBeverageSuitability {
	matchedTags: TBeverageTag[];
	suitability: number;
}

export type TBeverageSuitabilityRow = Prettify<
	TBeverage & IBeverageSuitability
>;

export interface IBeverageSuitabilityRowsResult {
	filteredRows: TBeverageSuitabilityRow[];
	pagedRows: TBeverageSuitabilityRow[];
	sortedRows: TBeverageSuitabilityRow[];
	totalPages: number;
}
