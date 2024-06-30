import {BEVERAGE_TAG_STYLE} from '@/constants';
import {RECIPE_TAG_STYLE} from '@/constants/recipes';
import type {ITagStyle} from '@/constants/types';

export const CUSTOMER_NORMAL_TAG_STYLE = {
	...RECIPE_TAG_STYLE,
	beverage: BEVERAGE_TAG_STYLE.positive,
} as const satisfies ITagStyle;
