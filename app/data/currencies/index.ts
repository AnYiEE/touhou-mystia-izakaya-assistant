import type { ISpriteConfig } from '@/utils/sprite/types';

export const CURRENCY_SPRITE_CONFIG = {
	col: 7,
	row: 1,
	scale: 4,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export * from './data';
