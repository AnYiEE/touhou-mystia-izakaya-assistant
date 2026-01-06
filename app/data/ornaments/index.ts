import type { ISpriteConfig } from '@/utils/sprite/types';

export const ORNAMENT_SPRITE_CONFIG = {
	col: 10,
	row: 2,
	scale: 4,
	size: { height: 26, width: 26 },
} as const satisfies ISpriteConfig;

export * from './data';
