import type { ITagStyle } from '@/data/types';
import type { ISpriteConfig } from '@/utils/sprite/types';

export const BEVERAGE_SPRITE_CONFIG = {
	col: 10,
	row: 5,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export const BEVERAGE_TAG_STYLE = {
	positive: {
		backgroundColor: '#b0cfd7',
		borderColor: '#6f929b',
		color: '#a45c22',
	},
} as const satisfies ITagStyle;

export * from './data';
