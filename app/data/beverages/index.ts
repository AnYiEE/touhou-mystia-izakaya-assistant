import type { ITagStyle } from '@/data/types';
import type { ISpriteConfig } from '@/utils/sprite/types';

export const BEVERAGE_SPRITE_CONFIG = {
	col: 10,
	row: 5,

	height: 520,
	width: 1040,
} as const satisfies ISpriteConfig;

export const BEVERAGE_TAG_STYLE = {
	positive: {
		backgroundColor: '#b0cfd7',
		borderColor: '#6f929b',
		color: '#a45c22',
	},
} as const satisfies ITagStyle;

export * from './data';
