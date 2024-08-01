import {type TTableColumns as TBeverageTableColumns} from './beverageTabContent';
import {type TTableColumns as TRecipeTableColumns} from './recipeTabContent';
import type {ICustomerRatingMap} from './types';

export const customerRatingColorMap = {
	普通: 'success',
	满意: 'warning',
} as const satisfies ICustomerRatingMap;

export enum TabVisibilityState {
	collapse = 'collapse',
	expand = 'expand',
}

export const beverageTableColumns = [
	{key: 'beverage', label: '酒水', sortable: true},
	{key: 'price', label: '售价', sortable: true},
	{key: 'suitability', label: '匹配度', sortable: true},
	{key: 'action', label: '操作', sortable: false},
] as const satisfies TBeverageTableColumns;

export const recipeTableColumns = [
	{key: 'recipe', label: '料理', sortable: true},
	{key: 'cooker', label: '厨具', sortable: false},
	{key: 'ingredient', label: '食材', sortable: false},
	{key: 'price', label: '售价', sortable: true},
	{key: 'suitability', label: '匹配度', sortable: true},
	{key: 'time', label: '烹饪时间', sortable: true},
	{key: 'action', label: '操作', sortable: false},
] as const satisfies TRecipeTableColumns;
