import {CUSTOMER_NORMAL_TAG_STYLE} from '@/constants';
import type {ITagStyle} from '@/constants/types';

export const CUSTOMER_SPECIAL_TAG_STYLE = {
	...CUSTOMER_NORMAL_TAG_STYLE,
} as const satisfies ITagStyle;
