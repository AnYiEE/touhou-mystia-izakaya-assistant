import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_RARE_SPRITE_CONFIG = {
	col: 10,
	row: 6,

	height: 1104,
	width: 1840,
} as const satisfies ISpriteConfig;

export * from './data';
