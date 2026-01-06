import type { ISpriteConfig } from '@/utils/sprite/types';

export const CLOTHES_SPRITE_CONFIG = {
	col: 10,
	row: 3,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export * from './data';
