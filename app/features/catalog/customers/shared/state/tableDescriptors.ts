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
export type TRecipeTableSortKey = 'recipe' | 'price' | 'suitability' | 'time';

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

export const beverageTableColumns = [
	{ key: 'beverage', label: '酒水', sortable: true },
	{ key: 'price', label: '售价', sortable: true },
	{ key: 'suitability', label: '匹配度', sortable: true },
	{ key: 'action', label: '操作', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TBeverageTableColumnKey>>;

export const recipeTableColumns = [
	{ key: 'recipe', label: '料理', sortable: true },
	{ key: 'cooker', label: '厨具', sortable: false },
	{ key: 'ingredient', label: '食材', sortable: false },
	{ key: 'price', label: '售价', sortable: true },
	{ key: 'suitability', label: '匹配度', sortable: true },
	{ key: 'time', label: '烹饪时间', sortable: true },
	{ key: 'action', label: '操作', sortable: false },
] as const satisfies ReadonlyArray<ITableColumn<TRecipeTableColumnKey>>;
