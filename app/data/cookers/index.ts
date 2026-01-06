import type { ISpriteConfig } from '@/utils/sprite/types';

export const COOKER_SPRITE_CONFIG = {
	col: 10,
	row: 5,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export * from './data';
