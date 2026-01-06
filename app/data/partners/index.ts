import type { ISpriteConfig } from '@/utils/sprite/types';

export const PARTNER_SPRITE_CONFIG = {
	col: 10,
	row: 2,
	size: { height: 184, width: 184 },
} as const satisfies ISpriteConfig;

export * from './data';
