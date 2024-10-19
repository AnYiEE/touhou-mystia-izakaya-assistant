import type {ISpriteConfig} from '@/utils/sprite/types';

export const CURRENCY_SPRITE_CONFIG = {
	col: 6,
	row: 1,

	height: 104,
	width: 624,
} as const satisfies ISpriteConfig;

export * from './data';
