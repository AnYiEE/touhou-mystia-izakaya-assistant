import type {ISpriteConfig} from '@/utils/sprite/types';

export const INGREDIENT_SPRITE_CONFIG = {
	col: 10,
	row: 6,

	height: 624,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
