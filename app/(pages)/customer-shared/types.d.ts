import { type SortDescriptor } from '@heroui/table';

export type TTabVisibilityState = 'collapse' | 'expand';

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

export type TTab = 'beverage' | 'customer' | 'ingredient' | 'recipe';

export type TBeverageTableColumnKey =
	| 'action'
	| 'beverage'
	| 'price'
	| 'suitability';

export type TRecipeTableColumnKey =
	| 'action'
	| 'cooker'
	| 'ingredient'
	| 'price'
	| 'recipe'
	| 'suitability'
	| 'time';
