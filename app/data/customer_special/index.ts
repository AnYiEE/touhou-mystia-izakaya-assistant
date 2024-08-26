import {CUSTOMER_NORMAL_TAG_STYLE} from '@/data/customer_normal';
import type {ITagStyle} from '@/data/types';
import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_SPECIAL_SPRITE_CONFIG = {
	col: 2,
	row: 1,

	height: 138,
	width: 276,
} as const satisfies ISpriteConfig;

export const CUSTOMER_SPECIAL_TAG_STYLE = {
	...CUSTOMER_NORMAL_TAG_STYLE,
} as const satisfies ITagStyle;

export * from './data';
