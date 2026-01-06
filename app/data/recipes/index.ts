import type { ITagStyle } from '@/data/types';
import { generateSpriteConfig } from '@/data/utils';
import { RECIPE_LIST } from './data';

export const RECIPE_SPRITE_CONFIG = generateSpriteConfig(RECIPE_LIST.length, {
	height: 26,
	width: 26,
});

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
