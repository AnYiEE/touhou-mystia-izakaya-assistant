import type {ISpriteConfig} from '@/utils/sprite/types';

export const COOKER_SPRITE_CONFIG = {
	col: 5,
	row: 2,

	height: 52,
	width: 130,
} as const satisfies ISpriteConfig;

export * from './data';
