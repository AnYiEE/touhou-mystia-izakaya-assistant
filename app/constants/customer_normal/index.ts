import {BEVERAGE_TAG_STYLE} from '@/constants';
import {RECIPE_TAG_STYLE} from '@/constants/recipes';
import type {ITagStyle} from '@/constants/types';

const CUSTOMER_NORMAL_TAG_STYLE = {
	beverage: BEVERAGE_TAG_STYLE.positive,
	...RECIPE_TAG_STYLE,
} as const satisfies ITagStyle;

export {CUSTOMER_NORMAL_TAG_STYLE};
