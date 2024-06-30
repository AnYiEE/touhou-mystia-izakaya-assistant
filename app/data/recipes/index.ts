import type {ISpriteConfig} from '@/utils/sprite/types';

export const RECIPE_SPRITE_CONFIG = {
	col: 10,
	row: 17,

	height: 1768,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
