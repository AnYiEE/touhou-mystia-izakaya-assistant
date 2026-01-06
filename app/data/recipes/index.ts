import type { ITagStyle } from '@/data/types';
import type { ISpriteConfig } from '@/utils/sprite/types';

export const RECIPE_SPRITE_CONFIG = {
	col: 10,
	row: 17,
	scale: 4,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export const RECIPE_TAG_STYLE = {
	negative: {
		backgroundColor: '#5d453a',
		borderColor: '#000000',
		color: '#e6b4a6', // The contrast of the tag color #e40d0d in the game is too low.
	},
	positive: {
		backgroundColor: '#e6b4a6',
		borderColor: '#9d5437',
		color: '#830000',
	},
} as const satisfies ITagStyle;

export * from './data';
