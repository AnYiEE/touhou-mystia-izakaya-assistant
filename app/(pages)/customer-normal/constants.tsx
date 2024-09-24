import type {ICustomerRatingMap} from './types';

export const customerRatingColorMap = {
	普通: 'success',
	极度不满: 'default',
	满意: 'warning',
} as const satisfies ICustomerRatingMap;

export {
	TabVisibilityState,
	customerTabStyleMap,
	ingredientTabStyleMap,
	recipeTableColumns,
	tachieBreakPoint,
} from '@/(pages)/customer-rare/constants';
