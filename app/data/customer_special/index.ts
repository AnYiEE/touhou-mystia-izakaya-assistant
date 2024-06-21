import type {ISpriteConfig} from '@/utils/sprite/types';

export const CUSTOMER_SPECIAL_SPRITE_CONFIG = {
	col: 2,
	row: 1,
	height: 138,
	width: 276,
} as const satisfies ISpriteConfig;

export * from './data';
