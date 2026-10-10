import { type SortDescriptor } from '@heroui/table';

import { type TCatalogGuestsMessageKey } from '@/features/catalog/guests/shared/messages';

export interface ITableColumn<T extends string> {
	key: T;
	labelKey: TCatalogGuestsMessageKey;
	sortable: boolean;
}

export type ITableSortDescriptor<T extends string> = Omit<
	SortDescriptor,
	'column' | 'direction'
> & {
	column?: T;
	direction?: SortDescriptor['direction'];
	lastColumn?: T;
	time?: number;
};

export type TBeverageTableSortKey = 'beverage' | 'price' | 'suitability';
export type TFoodTableSortKey = 'food' | 'price' | 'suitability' | 'time';

export type TBeverageTableColumnKey =
	'action' | 'beverage' | 'price' | 'suitability';

export type TFoodTableColumnKey =
	| 'action'
	| 'cookerType'
	| 'food'
	| 'ingredient'
	| 'price'
	| 'suitability'
	| 'time';

export const beverageTableColumns = [
	{
		key: 'beverage',
		labelKey: 'guests.table.column.beverage',
		sortable: true,
	},
	{ key: 'price', labelKey: 'guests.table.column.price', sortable: true },
	{
		key: 'suitability',
		labelKey: 'guests.table.column.suitability',
		sortable: true,
	},
	{ key: 'action', labelKey: 'guests.table.column.action', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TBeverageTableColumnKey>>;

export const foodTableColumns = [
	{ key: 'food', labelKey: 'guests.table.column.food', sortable: true },
	{
		key: 'cookerType',
		labelKey: 'guests.table.column.cookerType',
		sortable: false,
	},
	{
		key: 'ingredient',
		labelKey: 'guests.table.column.ingredient',
		sortable: false,
	},
	{ key: 'price', labelKey: 'guests.table.column.price', sortable: true },
	{
		key: 'suitability',
		labelKey: 'guests.table.column.suitability',
		sortable: true,
	},
	{ key: 'time', labelKey: 'guests.table.column.time', sortable: true },
	{ key: 'action', labelKey: 'guests.table.column.action', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TFoodTableColumnKey>>;
