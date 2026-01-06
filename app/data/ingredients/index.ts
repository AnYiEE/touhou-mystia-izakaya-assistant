import type { ITagStyle } from '@/data/types';
import { generateSpriteConfig } from '@/data/utils';
import { INGREDIENT_LIST } from './data';

export const INGREDIENT_SPRITE_CONFIG = generateSpriteConfig(
	INGREDIENT_LIST.length,
	{ height: 26, width: 26 }
);

export const INGREDIENT_TAG_STYLE = {
	positive: {
		backgroundColor: '#efe0a6',
		borderColor: '#a1904e',
		color: '#90611b',
	},
} as const satisfies ITagStyle;

export * from './data';
