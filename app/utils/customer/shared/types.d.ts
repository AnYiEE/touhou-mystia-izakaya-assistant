import { type SortDescriptor } from '@heroui/table';

import {
	type TBeverageTag,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';
import type { TBeverage, TRecipe } from '@/utils/types';

export type ITableSortDescriptor<T extends string> = Omit<
	SortDescriptor,
	'column' | 'direction'
> & {
	column?: T;
	direction?: SortDescriptor['direction'];
	lastColumn?: T;
	time?: number;
};

export type TRecipeTableSortKey = 'recipe' | 'price' | 'suitability' | 'time';
export type TBeverageTableSortKey = 'beverage' | 'price' | 'suitability';

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

export interface IIngredientScoreChangesResult {
	changesByName: Partial<
		Record<
			TIngredientName,
			{
				isDarkIngredient: boolean;
				isOrderTag: boolean;
				restriction: TIngredientScoreRestriction;
				scoreChange: number;
			}
		>
	>;
	darkIngredientNames: TIngredientName[];
}

export type TRecipeSuitabilityRow = Prettify<
	TRecipe & {
		matchedNegativeTags?: TRecipeTag[];
		matchedPositiveTags: TRecipeTag[];
		suitability: number;
	}
>;

export interface IRecipeSuitabilityRowsResult {
	filteredRows: TRecipeSuitabilityRow[];
	pagedRows: TRecipeSuitabilityRow[];
	sortedRows: TRecipeSuitabilityRow[];
	totalPages: number;
}

export type TBeverageSuitabilityRow = Prettify<
	TBeverage & { matchedTags: TBeverageTag[]; suitability: number }
>;

export interface IBeverageSuitabilityRowsResult {
	filteredRows: TBeverageSuitabilityRow[];
	pagedRows: TBeverageSuitabilityRow[];
	sortedRows: TBeverageSuitabilityRow[];
	totalPages: number;
}
