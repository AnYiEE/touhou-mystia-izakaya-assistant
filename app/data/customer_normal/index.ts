import {CUSTOMER_RARE_TAG_STYLE} from '@/data/customer_rare';
import type {ITagStyle} from '@/data/types';
import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_NORMAL_SPRITE_CONFIG = {
	col: 10,
	row: 5,

	height: 885,
	width: 1330,
} as const satisfies ISpriteConfig;

export const CUSTOMER_NORMAL_TAG_STYLE = {
	...CUSTOMER_RARE_TAG_STYLE,
} as const satisfies ITagStyle;

export * from './data';
