import type { ITagStyle } from '@/data/types';
import { generateSpriteConfig } from '@/data/utils';
import { BEVERAGE_LIST } from './data';

export const BEVERAGE_SPRITE_CONFIG = generateSpriteConfig(
	BEVERAGE_LIST.length,
	{ height: 26, width: 26 }
);

export const BEVERAGE_TAG_STYLE = {
	positive: {
		backgroundColor: '#b0cfd7',
		borderColor: '#6f929b',
		color: '#a45c22',
	},
} as const satisfies ITagStyle;

export * from './data';
