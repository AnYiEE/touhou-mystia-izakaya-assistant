import type {ISpriteConfig} from '@/utils/sprite/types';

export const CURRENCY_SPRITE_CONFIG = {
	col: 7,
	row: 1,

	height: 104,
	width: 728,
} as const satisfies ISpriteConfig;

export * from './data';
