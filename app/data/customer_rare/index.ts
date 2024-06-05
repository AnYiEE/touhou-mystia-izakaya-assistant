import type {ISpriteConfig} from '@/utils/sprite/types';

const CUSTOMER_RARE_SPRITE_CONFIG = {
	col: 10,
	row: 7,
	height: 1288,
	width: 1840,
} as const satisfies ISpriteConfig;

export * from './data';
export {CUSTOMER_RARE_SPRITE_CONFIG};
