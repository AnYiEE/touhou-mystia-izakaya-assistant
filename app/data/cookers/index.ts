import type { ISpriteConfig } from '@/utils/sprite/types';

export const COOKER_SPRITE_CONFIG = {
	col: 10,
	row: 5,

	height: 520,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
