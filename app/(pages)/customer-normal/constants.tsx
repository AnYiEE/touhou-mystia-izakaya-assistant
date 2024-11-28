import type {TCustomerRatingMap} from './types';

export const customerRatingColorMap = {
	普通: 'norm',
	极度不满: 'exbad',
	满意: 'good',
} as const satisfies TCustomerRatingMap;

export {
	TabVisibilityState,
	beverageTableColumns,
	customerTabStyleMap,
	ingredientTabStyleMap,
	recipeTableColumns,
	tachieBreakPoint,
} from '@/(pages)/customer-rare/constants';
