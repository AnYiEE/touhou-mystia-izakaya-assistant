import {CUSTOMER_NORMAL_TAG_STYLE} from '@/data/customer_normal';
import type {ITagStyle} from '@/data/types';
import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_RARE_SPRITE_CONFIG = {
	col: 10,
	row: 6,

	height: 1104,
	width: 1840,
} as const satisfies ISpriteConfig;

export const CUSTOMER_RARE_TAG_STYLE = {
	...CUSTOMER_NORMAL_TAG_STYLE,
} as const satisfies ITagStyle;

export * from './data';
