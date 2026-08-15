import { type SortDescriptor } from '@heroui/table';

export interface ITableColumn<T extends string> {
	key: T;
	label: string;
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
	| 'action'
	| 'beverage'
	| 'price'
	| 'suitability';

export type TFoodTableColumnKey =
	| 'action'
	| 'cookerType'
	| 'food'
	| 'ingredient'
	| 'price'
	| 'suitability'
	| 'time';

export const beverageTableColumns = [
	{ key: 'beverage', label: '酒水', sortable: true },
	{ key: 'price', label: '售价', sortable: true },
	{ key: 'suitability', label: '匹配度', sortable: true },
	{ key: 'action', label: '操作', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TBeverageTableColumnKey>>;

export const foodTableColumns = [
	{ key: 'food', label: '料理', sortable: true },
	{ key: 'cookerType', label: '厨具', sortable: false },
	{ key: 'ingredient', label: '食材', sortable: false },
	{ key: 'price', label: '售价', sortable: true },
	{ key: 'suitability', label: '匹配度', sortable: true },
	{ key: 'time', label: '烹饪时间', sortable: true },
	{ key: 'action', label: '操作', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TFoodTableColumnKey>>;
