import type { ITagStyle } from '@/data/types';
import type { ISpriteConfig } from '@/utils/sprite/types';

export const INGREDIENT_SPRITE_CONFIG = {
	col: 10,
	row: 7,

	height: 728,
	width: 1040,
} as const satisfies ISpriteConfig;

export const INGREDIENT_TAG_STYLE = {
	positive: {
		backgroundColor: '#efe0a6',
		borderColor: '#a1904e',
		color: '#90611b',
	},
} as const satisfies ITagStyle;

export * from './data';
