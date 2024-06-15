import type {ISpriteConfig} from '@/utils/sprite/types';

export const INGREDIENT_SPRITE_CONFIG = {
	col: 10,
	row: 7,
	height: 728,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
