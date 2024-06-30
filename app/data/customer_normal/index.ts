import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_NORMAL_SPRITE_CONFIG = {
	col: 10,
	row: 5,

	height: 600,
	width: 890,
} as const satisfies ISpriteConfig;

export * from './data';
