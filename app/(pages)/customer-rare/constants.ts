import {CUSTOMER_RARE_TAG_STYLE, CUSTOMER_SPECIAL_TAG_STYLE} from '@/constants';
import {type TTableColumns as TBeverageTableColumns} from './beverageTabContent';
import {type TTableColumns as TRecipeTableColumns} from './recipeTabContent';

export const customerTagStyleMap = {
	customer_rare: CUSTOMER_RARE_TAG_STYLE,
	customer_special: CUSTOMER_SPECIAL_TAG_STYLE,
} as const;

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
	{key: 'kitchenware', label: '厨具', sortable: false},
	{key: 'ingredient', label: '食材', sortable: false},
	{key: 'price', label: '售价', sortable: true},
	{key: 'suitability', label: '匹配度', sortable: true},
	{key: 'action', label: '操作', sortable: false},
] as const satisfies TRecipeTableColumns;
