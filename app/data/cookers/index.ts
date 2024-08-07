import type {ISpriteConfig} from '@/utils/sprite/types';

export const COOKER_SPRITE_CONFIG = {
	col: 5,
	row: 1,

	height: 104,
	width: 520,
} as const satisfies ISpriteConfig;

export * from './data';
