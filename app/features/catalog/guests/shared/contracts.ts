import { type TFoodSuitabilityRowData } from '@/domain/catalog/food/FoodCatalog';
import type { TBeverage } from '@/domain/catalog/food/types';
import type { TBeverageTagId } from '@/domain/data/tags/types';

import { type TTabVisibilityState } from './state/tabVisibility';

export interface IGuestTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TGuestTabStyleMap = Record<TTabVisibilityState, IGuestTabStyle>;

export interface IIngredientsTabStyle {
	ariaLabel: string;
	buttonNode: ReactNodeWithoutBoolean;
	classNames: { content: string; sideButtonGroup: string };
}

export type TIngredientsTabStyleMap = Record<
	TTabVisibilityState,
	IIngredientsTabStyle
>;

export type TTab = 'beverage' | 'food' | 'guest' | 'ingredient';

export type TFoodSuitabilityRow = TFoodSuitabilityRowData;

export interface IFoodSuitabilityRowsResult {
	filteredRows: TFoodSuitabilityRow[];
	pagedRows: TFoodSuitabilityRow[];
	sortedRows: TFoodSuitabilityRow[];
	totalPages: number;
}

export type TBeverageSuitabilityRow = Prettify<
	TBeverage & { matchedTags: TBeverageTagId[]; suitability: number }
>;

export interface IBeverageSuitabilityRowsResult {
	filteredRows: TBeverageSuitabilityRow[];
	pagedRows: TBeverageSuitabilityRow[];
	sortedRows: TBeverageSuitabilityRow[];
	totalPages: number;
}
