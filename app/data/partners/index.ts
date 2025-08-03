import type { ISpriteConfig } from '@/utils/sprite/types';

export const PARTNER_SPRITE_CONFIG = {
	col: 10,
	row: 2,

	height: 368,
	width: 1840,
} as const satisfies ISpriteConfig;

export * from './data';
