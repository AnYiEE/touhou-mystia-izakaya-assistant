import type {ICustomerRatingMap} from './types';

export const customerRatingColorMap = {
	普通: 'success',
	满意: 'warning',
} as const satisfies ICustomerRatingMap;

export {TabVisibilityState, beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-rare/constants';
