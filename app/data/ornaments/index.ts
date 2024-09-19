import type {ISpriteConfig} from '@/utils/sprite/types';

export const ORNAMENT_SPRITE_CONFIG = {
	col: 10,
	row: 2,

	height: 208,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
