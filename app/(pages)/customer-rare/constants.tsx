import {type Config} from 'use-breakpoint';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretDown, faCaretUp} from '@fortawesome/free-solid-svg-icons';

import {type TTableColumns as TBeverageTableColumns} from './beverageTabContent';
import {type TTableColumns as TRecipeTableColumns} from './recipeTabContent';
import type {ICustomerRatingMap, ICustomerTabStyleMap, IIngredientsTabStyleMap} from './types';
import {CUSTOMER_RARE_TAG_STYLE, CUSTOMER_SPECIAL_TAG_STYLE} from '@/data';

export const customerTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: <FontAwesomeIcon icon={faCaretDown} size="xl" className="-mt-0.5" />,
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: <FontAwesomeIcon icon={faCaretUp} size="xl" className="mt-0.5" />,
		classNames: {
			content: 'max-h-vmax-half',
			sideButtonGroup: '',
		},
	},
} as const satisfies ICustomerTabStyleMap;

export const ingredientTabStyleMap = {
	collapse: {
		ariaLabel: '展开',
		buttonNode: <FontAwesomeIcon icon={faCaretDown} size="xl" className="-mt-0.5" />,
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: '收起',
		buttonNode: <FontAwesomeIcon icon={faCaretUp} size="xl" className="mt-0.5" />,
		classNames: {
			content: 'max-h-vmax-half',
			sideButtonGroup: '',
		},
	},
} as const satisfies IIngredientsTabStyleMap;

export const customerTagStyleMap = {
	customer_rare: CUSTOMER_RARE_TAG_STYLE,
	customer_special: CUSTOMER_SPECIAL_TAG_STYLE,
} as const;

export const customerRatingColorMap = {
	不满: 'secondary',
	完美: 'danger',
	普通: 'success',
	极度不满: 'default',
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

export const tachieBreakPoint = {
	noTachie: -1,
	tachie: 1420,
} as const satisfies Config;
