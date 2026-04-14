import { type Config } from 'use-breakpoint';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

import { type TTableColumns as TBeverageTableColumns } from './beverageTabContent';
import { type TTableColumns as TRecipeTableColumns } from './recipeTabContent';
import type { TCustomerTabStyleMap, TIngredientsTabStyleMap } from './types';
import { tUI } from '@/i18n';

export const customerTabStyleMap = {
	collapse: {
		ariaLabel: tUI('展开'),
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretDown}
				size="xl"
				className="-mt-0.5 !h-full"
			/>
		),
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: tUI('收起'),
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretUp}
				size="xl"
				className="mt-0.5 !h-full"
			/>
		),
		classNames: { content: 'max-h-vmax-half', sideButtonGroup: '' },
	},
} as const satisfies TCustomerTabStyleMap;

export const ingredientTabStyleMap = {
	collapse: {
		ariaLabel: tUI('展开'),
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretDown}
				size="xl"
				className="-mt-0.5 !h-full"
			/>
		),
		classNames: {
			content: 'max-h-[calc(var(--safe-h-dvh-half)-9.25rem)] min-h-20',
			sideButtonGroup: 'hidden xl:block',
		},
	},
	expand: {
		ariaLabel: tUI('收起'),
		buttonNode: (
			<FontAwesomeIcon
				icon={faCaretUp}
				size="xl"
				className="mt-0.5 !h-full"
			/>
		),
		classNames: { content: 'max-h-vmax-half', sideButtonGroup: '' },
	},
} as const satisfies TIngredientsTabStyleMap;

export const beverageTableColumns = [
	{ key: 'beverage', label: tUI('酒水'), sortable: true },
	{ key: 'price', label: tUI('售价'), sortable: true },
	{ key: 'suitability', label: tUI('匹配度'), sortable: true },
	{ key: 'action', label: tUI('操作'), sortable: false },
] as const satisfies TBeverageTableColumns;

export const recipeTableColumns = [
	{ key: 'recipe', label: tUI('料理'), sortable: true },
	{ key: 'cooker', label: tUI('厨具'), sortable: false },
	{ key: 'ingredient', label: tUI('食材'), sortable: false },
	{ key: 'price', label: tUI('售价'), sortable: true },
	{ key: 'suitability', label: tUI('匹配度'), sortable: true },
	{ key: 'time', label: tUI('烹饪时间'), sortable: true },
	{ key: 'action', label: tUI('操作'), sortable: false },
] as const satisfies TRecipeTableColumns;

export const tabVisibilityStateMap = {
	collapse: 'collapse',
	expand: 'expand',
} as const;

export const tachieBreakPointMap = {
	noTachie: -1,
	tachie: 1460,
} as const satisfies Config;
