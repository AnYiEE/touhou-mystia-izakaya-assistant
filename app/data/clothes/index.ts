import type {ISpriteConfig} from '@/utils/sprite/types';

export const CLOTHES_SPRITE_CONFIG = {
	col: 10,
	row: 3,

	height: 312,
	width: 1040,
} as const satisfies ISpriteConfig;

export * from './data';
